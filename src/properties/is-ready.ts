import ts from 'typescript';
import { createObjectMethod, emitGlobalFunction } from '../util';
import { CreatePropertyOptions } from './types';

const isReadyFunctionTemplate = `function __loadable_isReady__(self, props) {
  const key=self.resolve(props)
  if (self.resolved[key] !== true) {
    return false
  }

  if (typeof __webpack_modules__ !== "undefined") {
    return !!__webpack_modules__[self.resolve(props)];
  }
  
  return false;
}`;

export default function isReadyProperty({ ctx }: CreatePropertyOptions) {
  emitGlobalFunction(ctx, 'loadable:isReadyHelper', isReadyFunctionTemplate);
  return createObjectMethod(
    'isReady',
    ['props'],
    ts.createBlock(
      [
        ts.createReturn(
          ts.createCall(ts.createIdentifier('__loadable_isReady__'), undefined, [
            ts.createIdentifier('this'),
            ts.createIdentifier('props'),
          ]),
        ),
      ],
      true,
    ),
  );
}
