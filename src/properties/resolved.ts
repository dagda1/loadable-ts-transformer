import ts from 'typescript';

export default function resolved() {
  return ts.createPropertyAssignment(ts.createIdentifier('resolved'), ts.createObjectLiteral([], false));
}
