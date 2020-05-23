import ts from 'typescript';

import { CreatePropertyOptions } from './types';

export default function importAsyncProperty({ funcNode }: CreatePropertyOptions) {
  if (ts.isMethodDeclaration(funcNode)) {
    return ts.createPropertyAssignment(
      ts.createIdentifier('importAsync'),
      ts.createArrowFunction(
        undefined,
        undefined,
        funcNode.parameters,
        undefined,
        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        // TODO: can we rely on this
        ts.createBlock([funcNode.body?.statements[0]!], true),
      ),
    );
  }

  return ts.createPropertyAssignment(ts.createIdentifier('importAsync'), funcNode);
}
