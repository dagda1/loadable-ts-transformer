import ts from 'typescript';
import { createObjectMethod, emitGlobalFunction } from '../util';

const requireAsyncSyncFunctionTemplate = `function __loadable_requireAsyncSync__(self, props) {
  const key = self.resolve(props)
  self.resolved[key] = false
  return self.importAsync(props).then(resolved => {
   self.resolved[key] = true
   return resolved;
  });       
}`;

export default function requireAsyncProperty(ctx: ts.TransformationContext): ts.ObjectLiteralElementLike {
  emitGlobalFunction(ctx, 'loadable:requireAsycSyncHelper', requireAsyncSyncFunctionTemplate);
  return createObjectMethod(
    'requireAsync',
    ['props'],
    ts.createBlock(
      [
        ts.createReturn(
          ts.createCall(ts.createIdentifier('__loadable_requireAsyncSync__'), undefined, [
            ts.createIdentifier('this'),
            ts.createIdentifier('props'),
          ]),
        ),
      ],
      true,
    ),
  );
}
