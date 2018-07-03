import { experimental } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { Observable, concat, from } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

import { getWorkspace, getWorkspacePath } from '../utils/workspace';
import { getLatestPackageVersion, PackageInformation } from '../utils/npm';
import { NodeDependencyType, addPackageJsonDependency, removePackageJsonDependency } from '../utils/dependencies';

export default function(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      updateDevDependencies(),
      modifyTestNodeForAllProjectsInWorkspaces()
      // addJestFilesToEachProjectWithTests,
    ])(tree, context);
  };
}

function updateDevDependencies(): Rule {
  return (tree: Tree, context: SchematicContext): Observable<Tree> => {
    context.addTask(new NodePackageInstallTask());

    return concat(addJestDependencies(tree, context), removeKarmaDependencies(tree, context));
  }
}

function addJestDependencies(tree: Tree, context: SchematicContext): Observable<Tree> {
  return from(['jest', 'jest-preset-angular', 'angular-jest-build', '@types/jest']).pipe(
    concatMap((packageName: string) => getLatestPackageVersion(packageName)),
    map((packageInfo: PackageInformation) => {
      context.logger.debug(`Adding ${packageInfo.name}`);

      addPackageJsonDependency(tree, {
        type: NodeDependencyType.Dev,
        name: packageInfo.name,
        version: `^${packageInfo.version}`,
      });

      return tree;
    })
  );
}

function removeKarmaDependencies(tree: Tree, context: SchematicContext): Observable<Tree> {
  return from([
    'karma',
    'karma-chrome-launcher',
    'karma-coverage-istanbul-reporter',
    'karma-jasmine',
    'karma-jasmine-html-reporter'
  ]).pipe(
    map((packageName: string) => {
      context.logger.debug(`Removing ${packageName}`);

      removePackageJsonDependency(tree, packageName);

      return tree;
    })
  );
}

function modifyTestNodeForAllProjectsInWorkspaces(): Rule {
  return (host: Tree, context: SchematicContext) => {
    const workspacePath = getWorkspacePath(host);
    const workspace = getWorkspace(host);

    getProjectsWithTests(workspace).forEach(project => {
      context.logger.debug(`Updating ${project}'s 'test' node`);

      (project.architect as experimental.workspace.WorkspaceTool).test = {
        builder: 'angular-jest-build:test',
        options: {}
      };
    });

    host.overwrite(workspacePath, JSON.stringify(workspace, null, 2));

    return host;
  };
}

function getProjectsWithTests(workspace: experimental.workspace.WorkspaceSchema) {
  return Object.keys(workspace.projects)
    .map(name => workspace.projects[name] as experimental.workspace.WorkspaceProject)
    .filter(project => project.architect && project.architect.test);
}
