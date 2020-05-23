import ts from 'typescript';

import { CreatePropertyOptions } from './types';

const ___slice = [].slice;

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
        ts.createBlock([...___slice.call(funcNode.body?.statements)], true),
      ),
    );
  }

  return ts.createPropertyAssignment(ts.createIdentifier('importAsync'), funcNode);
}
