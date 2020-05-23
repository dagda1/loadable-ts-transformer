import ts from 'typescript';
import chunkNameProperty from './properties/chunk-name';
import requireAsyncProperty from './properties/require-async';
import requireSyncProperty from './properties/require-sync';
import isReadyProperty from './properties/is-ready';
import resolveProperty from './properties/resolve';
import importAsyncProperty from './properties/import-async-property';
import { getLeadingComments, removeMatchingLeadingComments } from './util';
import resolved from './properties/resolved';

const LOADABLE_COMMENT = '#__LOADABLE__';

function isRenderPropsExpression(node: ts.Node) {
  return (
    ts.isExpressionStatement(node) &&
    ts.isCallExpression(node.expression) &&
    ts.isPropertyAccessExpression(node.expression.expression) &&
    node.expression.expression.name.escapedText === 'lib' &&
    ts.isIdentifier(node.expression.expression.expression) &&
    node.expression.expression.expression.escapedText === 'loadable'
  );
}

function isLoadableNode(node: ts.Node, ctx: ts.TransformationContext): node is ts.Node {
  if (ts.isObjectLiteralExpression(node)) {
    // TODO: do we need to use node.properties
    if (getLeadingComments(node.properties[0])?.some(comment => comment.includes(LOADABLE_COMMENT))) {
      removeMatchingLeadingComments(node.properties[0], ctx, /\#__LOADABLE__/g);
      return true;
    }
  }

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    if (
      isRenderPropsExpression(node.parent.parent) ||
      getLeadingComments(node)?.some(comment => comment.includes(LOADABLE_COMMENT))
    ) {
      removeMatchingLeadingComments(node, ctx, /\#__LOADABLE__/g);
      return true;
    }

    return false;
  }

  if (!ts.isCallExpression(node)) {
    return false;
  }

  const identifier = node.expression;

  if (!ts.isIdentifier(identifier)) {
    return false;
  }

  if (identifier.text !== 'loadable') {
    return false;
  }

  return true;
}

function collectImports(loadableCallExpressionNode: ts.Node, ctx: ts.TransformationContext) {
  const ret: ts.CallExpression[] = [];
  function visit(node: ts.Node): ts.Node {
    if (node.kind === ts.SyntaxKind.ImportKeyword) {
      ret.push(node.parent as ts.CallExpression);
      return node;
    }

    return ts.visitEachChild(node, visit, ctx);
  }

  if (ts.isCallExpression(loadableCallExpressionNode)) {
    ts.visitNodes(loadableCallExpressionNode.arguments, visit);
  } else {
    ts.visitNode(loadableCallExpressionNode, visit);
  }

  return ret;
}

function getFuncNode(
  loadableCallExpressionNode: ts.Node,
): ts.MethodDeclaration | ts.FunctionExpression | ts.ArrowFunction | undefined {
  if (ts.isObjectLiteralExpression(loadableCallExpressionNode)) {
    // TODO: find this node?
    return loadableCallExpressionNode.properties[0] as ts.MethodDeclaration;
  }
  if (ts.isFunctionLike(loadableCallExpressionNode)) {
    return loadableCallExpressionNode as ts.FunctionExpression;
  }

  if (!ts.isCallExpression(loadableCallExpressionNode)) {
    return;
  }

  const arg = loadableCallExpressionNode.arguments[0];
  if (!arg) {
    return;
  }

  if (!ts.isArrowFunction(arg) && !ts.isFunctionExpression(arg)) {
    return;
  }

  return arg;
}

export function loadableTransformer(ctx: ts.TransformationContext) {
  function visitNode(node: ts.Node): ts.Node {
    if (!isLoadableNode(node, ctx)) {
      return ts.visitEachChild(node, visitNode, ctx);
    }

    const funcNode = getFuncNode(node);
    if (!funcNode) {
      return node;
    }

    // Collect dynamic import call expressions such as `import('./foo')`
    const imports = collectImports(node, ctx);

    // Ignore loadable function that does not have any "import" call
    if (imports.length === 0) {
      return node;
    }

    // Multiple imports call is not supported
    if (imports.length > 1) {
      throw new Error('loadable: multiple import calls inside `loadable()` function are not supported.');
    }

    const [callNode] = imports;

    const obj = ts.createObjectLiteral(
      [
        resolved(),
        chunkNameProperty({ ctx, callNode, funcNode }),
        isReadyProperty({ ctx, callNode, funcNode }),
        importAsyncProperty({ ctx, callNode, funcNode }),
        requireAsyncProperty({ ctx, callNode, funcNode }),
        requireSyncProperty({ ctx, callNode, funcNode }),
        resolveProperty({ ctx, callNode, funcNode }),
      ],
      true,
    );

    if (ts.isObjectLiteralExpression(node)) {
      return ts.updateObjectLiteral(node, obj.properties);
    }

    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      return obj;
    }

    if (!ts.isCallExpression(node)) {
      return node;
    }

    return ts.updateCall(node, node.expression || [], undefined, [obj]);
  }

  return (source: ts.SourceFile) => ts.updateSourceFileNode(source, ts.visitNodes(source.statements, visitNode));
}
