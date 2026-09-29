import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * @param {string[]} args
 * @returns {Promise<{ stdout: string, code: number }>}
 */
async function git(args) {
  try {
    const { stdout } = await execFileAsync('git', args, { encoding: 'utf8' });
    return { stdout: stdout.trim(), code: 0 };
  } catch (error) {
    if (typeof error.code !== 'number') {
      throw error;
    }
    const stdout = typeof error.stdout === 'string' ? error.stdout.trim() : '';
    const stderr = typeof error.stderr === 'string' ? error.stderr.trim() : '';
    return { stdout: stderr || stdout, code: error.code };
  }
}

/**
 * Crea o cambia a la rama feat/{slug}.
 * Si hay cambios pendientes, los commitea antes de cambiar de rama.
 * @param {string} slug - El slug de la spec.
 * @returns {Promise<string>} - El nombre de la rama.
 */
export async function gitBranch(slug) {
  const branchName = `feat/${slug}`;
  const status = await git(['status', '--porcelain']);
  if (status.code !== 0) {
    throw new Error(status.stdout || 'git status failed');
  }
  if (status.stdout) {
    const add = await git(['add', '.']);
    if (add.code !== 0) {
      throw new Error(add.stdout || 'git add failed');
    }
    const commit = await git(['commit', '-m', `feat: add ${slug}`]);
    if (commit.code !== 0) {
      throw new Error(commit.stdout || 'git commit failed');
    }
  }
  const exists = await git(['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`]);
  const checkout = exists.code === 0
    ? await git(['checkout', branchName])
    : await git(['checkout', '-b', branchName]);
  if (checkout.code !== 0) {
    throw new Error(checkout.stdout || `git checkout ${branchName} failed`);
  }
  return branchName;
}

const isMain = process.argv[1]?.endsWith('git-branch.mjs');
if (isMain) {
  const slug = process.argv[2];
  if (!slug) {
    console.error('usage: node git-branch.mjs <slug>');
    process.exit(1);
  }
  console.log(await gitBranch(slug));
}
