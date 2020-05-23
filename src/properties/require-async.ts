import ts from 'typescript';
import { createObjectMethod } from '../util';
import { CreatePropertyOptions } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function requireAsyncProperty({ ctx }: CreatePropertyOptions) {
  return createObjectMethod(
    'requireAsync',
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
        ts.createExpressionStatement(
          ts.createBinary(
            ts.createElementAccess(
              ts.createPropertyAccess(ts.createThis(), ts.createIdentifier('resolved')),
              ts.createIdentifier('key'),
            ),
            ts.createToken(ts.SyntaxKind.EqualsToken),
            ts.createFalse(),
          ),
        ),
        ts.createReturn(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createCall(ts.createPropertyAccess(ts.createThis(), ts.createIdentifier('importAsync')), undefined, [
                ts.createIdentifier('props'),
              ]),
              ts.createIdentifier('then'),
            ),
            undefined,
            [
              ts.createArrowFunction(
                undefined,
                undefined,
                [
                  ts.createParameter(
                    undefined,
                    undefined,
                    undefined,
                    ts.createIdentifier('resolved'),
                    undefined,
                    undefined,
                    undefined,
                  ),
                ],
                undefined,
                ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                ts.createBlock(
                  [
                    ts.createExpressionStatement(
                      ts.createBinary(
                        ts.createElementAccess(
                          ts.createPropertyAccess(ts.createThis(), ts.createIdentifier('resolved')),
                          ts.createIdentifier('key'),
                        ),
                        ts.createToken(ts.SyntaxKind.EqualsToken),
                        ts.createTrue(),
                      ),
                    ),
                    ts.createReturn(ts.createIdentifier('resolved')),
                  ],
                  true,
                ),
              ),
            ],
          ),
        ),
      ],
      true,
    ),
  );
}
