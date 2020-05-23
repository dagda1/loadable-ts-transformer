import ts from 'typescript';
import { createObjectMethod } from '../util';
import { CreatePropertyOptions } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function isReadyProperty({ ctx }: CreatePropertyOptions) {
  return createObjectMethod(
    'isReady',
    ['props'],
    ts.createBlock(
      [
        ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                ts.createIdentifier('key'),
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
            ts.createElementAccess(
              ts.createPropertyAccess(ts.createThis(), ts.createIdentifier('resolved')),
              ts.createIdentifier('key'),
            ),
            ts.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
            ts.createTrue(),
          ),
          ts.createBlock([ts.createReturn(ts.createFalse())], true),
          undefined,
        ),
        ts.createIf(
          ts.createBinary(
            ts.createTypeOf(ts.createIdentifier('__webpack_modules__')),
            ts.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
            ts.createStringLiteral('undefined'),
          ),
          ts.createBlock(
            [
              ts.createReturn(
                ts.createPrefix(
                  ts.SyntaxKind.ExclamationToken,
                  ts.createPrefix(
                    ts.SyntaxKind.ExclamationToken,
                    ts.createElementAccess(ts.createIdentifier('__webpack_modules__'), ts.createIdentifier('key')),
                  ),
                ),
              ),
            ],
            true,
          ),
          undefined,
        ),
        ts.createReturn(ts.createFalse()),
      ],
      true,
    ),
  );
}
