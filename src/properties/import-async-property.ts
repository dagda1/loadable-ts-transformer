import ts from 'typescript';

import { CreatePropertyOptions } from './types';

export default function importAsyncProperty({ funcNode }: CreatePropertyOptions) {
  return ts.createPropertyAssignment(ts.createIdentifier('importAsync'), funcNode);
}
