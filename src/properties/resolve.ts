import ts, { SyntaxKind } from 'typescript';
import { getImportArg, createObjectMethod } from '../util';
import { CreatePropertyOptions } from './types';

function getCallValue(importArg: ts.Expression) {
  if ([SyntaxKind.TemplateExpression, SyntaxKind.BinaryExpression, SyntaxKind.StringLiteral].includes(importArg.kind)) {
    return importArg;
  }

  return ts.createStringLiteral(importArg.getFullText());
}

export default function resolveProperty({ callNode, funcNode }: CreatePropertyOptions) {
  const importArg = getImportArg(callNode);
  const id = getCallValue(importArg);
  const args = funcNode.parameters.map(p => p.getFullText());

  return createObjectMethod(
    'resolve',
    args,
    ts.createBlock(
      [
        ts.createIf(
          ts.createPropertyAccess(ts.createIdentifier('require'), ts.createIdentifier('resolveWeak')),
          ts.createBlock(
            [
              ts.createReturn(
                ts.createCall(
                  ts.createPropertyAccess(ts.createIdentifier('require'), ts.createIdentifier('resolveWeak')),
                  undefined,
                  [id],
                ),
              ),
            ],
            true,
          ),
          undefined,
        ),
        ts.createReturn(
          ts.createCall(
            ts.createCall(ts.createIdentifier('eval'), undefined, [ts.createStringLiteral('require.resolve')]),
            undefined,
            [id],
          ),
        ),
      ],
      true,
    ),
  );
}
