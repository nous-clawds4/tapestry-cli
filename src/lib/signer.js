/**
 * Nostr event signing.
 *
 * Default: uses the Tapestry Assistant nsec from brainstorm.conf inside the
 *          Docker container (no external auth needed).
 * --personal: uses the operator's personal nsec from 1Password (Touch ID).
 * NOSTR_NSEC env var: overrides everything.
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(execCb);
const CONTAINER = 'tapestry-tapestry-1';

let nostrTools;
async function loadNostrTools() {
  if (!nostrTools) nostrTools = await import('nostr-tools');
  return nostrTools;
}

/**
 * Get nsec from the Tapestry Assistant (brainstorm.conf inside Docker).
 */
async function getTapestryAssistantNsec() {
  const { stdout } = await execAsync(
    `docker exec ${CONTAINER} bash -c 'source /etc/brainstorm.conf && echo $BRAINSTORM_RELAY_NSEC'`,
    { timeout: 10000 }
  );
  return stdout.trim();
}

/**
 * Get nsec from 1Password (requires Touch ID).
 */
async function getPersonalNsec() {
  console.log('  🔐 Requesting nsec from 1Password (Touch ID required)...');
  const { stdout } = await execAsync(
    'op item get "Nous - Nostr Key" --fields label=nsec --reveal',
    { timeout: 60000 }
  );
  return stdout.trim();
}

/**
 * Get a keypair for signing.
 * @param {object} opts - { personal: boolean }
 * @returns {{ sk: Uint8Array, pubkey: string, label: string }}
 */
export async function getKeypair(opts = {}) {
  const nt = await loadNostrTools();
  const { nip19 } = nt;

  let nsec;
  let label;

  if (process.env.NOSTR_NSEC) {
    nsec = process.env.NOSTR_NSEC;
    label = 'env';
  } else if (opts.personal) {
    nsec = await getPersonalNsec();
    label = 'personal (1Password)';
  } else {
    nsec = await getTapestryAssistantNsec();
    label = 'Tapestry Assistant';
  }

  if (!nsec || !nsec.startsWith('nsec1')) {
    throw new Error(
      'Invalid nsec. Ensure brainstorm.conf has BRAINSTORM_RELAY_NSEC ' +
      'or pass --personal to use 1Password.'
    );
  }

  const decoded = nip19.decode(nsec);
  const sk = decoded.data;
  const pubkey = nt.getPublicKey(sk);

  return { sk, pubkey, label };
}

/**
 * Create and sign a nostr event.
 * @param {object} template - { kind, tags, content, created_at }
 * @param {object} opts - { personal: boolean }
 * @returns {object} Signed event with id and sig
 */
export async function signEvent(template, opts = {}) {
  const nt = await loadNostrTools();
  const { sk, pubkey, label } = await getKeypair(opts);

  const event = {
    kind: template.kind,
    created_at: template.created_at || Math.floor(Date.now() / 1000),
    tags: template.tags || [],
    content: template.content || '',
    pubkey,
  };

  const signed = nt.finalizeEvent(event, sk);
  signed._signerLabel = label;
  return signed;
}
