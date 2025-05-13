import { RelativePattern, Uri, window, workspace, WorkspaceFolder } from "vscode";
import { Action } from "../../api/types";
import path from "path";

export async function getLocalActionsFiles(currentWorkspace?: WorkspaceFolder, targetPaths?: Uri[]) {
  if (!currentWorkspace) {
    return [];
  }

  const actionsFiles = await workspace.findFiles(new RelativePattern(currentWorkspace, `**/.vscode/actions.json`));

  if (!targetPaths || targetPaths.length === 0) {
    return actionsFiles;
  }

  const isCaseSensitive = process.platform === 'linux';

  // Filter actions based on the .vscode folder of each being an ancestor of the target paths
  return actionsFiles.filter(actionsFile => {
    const actionsParentPath = 
      isCaseSensitive 
        ? path.join(actionsFile.fsPath, '../..')
        : path.join(actionsFile.fsPath, '../..').toLowerCase();

    // Only return action configs that are applicable to all selected file paths
    return targetPaths.every(targetPath => {
      return isCaseSensitive
        ? path.dirname(targetPath.fsPath).startsWith(actionsParentPath)
        : path.dirname(targetPath.fsPath).toLowerCase().startsWith(actionsParentPath);
    });
  });
}

export async function getLocalActions(currentWorkspace: WorkspaceFolder, targetPaths?: Uri[]) {
  const actions: Action[] = [];

  if (currentWorkspace) {
    const actionsFiles = await getLocalActionsFiles(currentWorkspace, targetPaths);

    for (const file of actionsFiles) {
      const actionsContent = await workspace.fs.readFile(file);
      try {
        const actionsJson: Action[] = JSON.parse(actionsContent.toString());

        // Maybe one day replace this with real schema validation
        if (Array.isArray(actionsJson)) {
          actionsJson.forEach((action, index) => {
            if (
              typeof action.name === `string` &&
              typeof action.command === `string` &&
              [`ile`, `pase`, `qsh`].includes(action.environment) &&
              Array.isArray(action.extensions)
            ) {
              actions.push({
                ...action,
                type: `file`
              });
            } else {
              throw new Error(`Invalid Action defined at index ${index}.`);
            }
          })
        }
      } catch (e: any) {
        // ignore
        window.showErrorMessage(`Error parsing ${file.fsPath}: ${e.message}\n`);
      }
    };
  }

  return actions;
}

export async function getEvfeventFiles(currentWorkspace: WorkspaceFolder) {
  if (currentWorkspace) {
    const relativeSearch = new RelativePattern(currentWorkspace, `**/.evfevent/*`);
    const iprojectFiles = await workspace.findFiles(relativeSearch, null);

    return iprojectFiles;
  }
}