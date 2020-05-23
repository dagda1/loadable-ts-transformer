import ts from 'typescript';

import { createObjectMethod } from '../util';
import { CreatePropertyOptions } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function requireSyncProperty({ ctx }: CreatePropertyOptions) {
  return createObjectMethod(
    'requireSync',
    ['props'],
    ts.createBlock(
      [
        ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                ts.createIdentifier('id'),
                undefined,
                ts.createCall(ts.createPropertyAccess(ts.createThis(), ts.createIdentifier('resolve')), undefined, [
                  ts.createIdentifier('props'),
                ]),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
        ts.createIf(
          ts.createBinary(
            ts.createTypeOf(ts.createIdentifier('__webpack_require__')),
            ts.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
            ts.createStringLiteral('undefined'),
          ),
          ts.createBlock(
            [
              ts.createReturn(
                ts.createCall(ts.createIdentifier('__webpack_require__'), undefined, [ts.createIdentifier('id')]),
              ),
            ],
            true,
          ),
          undefined,
        ),
        ts.createReturn(
          ts.createCall(
            ts.createCall(ts.createIdentifier('eval'), undefined, [ts.createStringLiteral('module.require')]),
            undefined,
            [ts.createIdentifier('id')],
          ),
        ),
      ],
      true,
    ),
  );
}
