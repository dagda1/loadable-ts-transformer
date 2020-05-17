import vm from 'vm';
import ts, { TemplateSpan, TemplateLiteral, TemplateExpression } from 'typescript';
import { getImportArg, getLeadingComments, removeMatchingLeadingComments, createObjectMethod } from '../util';
import { CreatePropertyOptions } from './types';

const JS_PATH_REGEXP = /^[./]+|(\.js$)/g;
const MATCH_LEFT_HYPHENS_REPLACE_REGEX = /^-/g;
// https://github.com/webpack/webpack/blob/master/lib/Template.js
const WEBPACK_CHUNK_NAME_REGEXP = /webpackChunkName/;
const WEBPACK_PATH_NAME_NORMALIZE_REPLACE_REGEX = /[^a-zA-Z0-9_!§$()=\-^°]+/g;
const WEBPACK_MATCH_PADDED_HYPHENS_REPLACE_REGEX = /^-|-$/g;

function readWebpackCommentValues(str: string): { webpackChunkName: string } {
  try {
    const values = vm.runInNewContext(`(function(){return {${str}};})()`);
    return values;
  } catch (e) {
    throw Error(`compilation error while processing: /*${str}*/: ${e.message}`);
  }
}

function writeWebpackCommentValues(values: any) {
  try {
    const str = Object.keys(values)
      .map(key => `${key}: ${JSON.stringify(values[key])}`)
      .join(', ');
    return ` ${str} `;
  } catch (e) {
    throw Error(`compilation error while processing: /*${values}*/: ${e.message}`);
  }
}

function getChunkNameComment(importArg: ts.Node) {
  const comments = getLeadingComments(importArg);
  if (!comments.length) return null;
  return comments.find(comment => WEBPACK_CHUNK_NAME_REGEXP.test(comment));
}

function getRawChunkNameFromCommments(importArg: ts.Node) {
  const chunkNameComment = getChunkNameComment(importArg);
  if (!chunkNameComment) return null;
  return readWebpackCommentValues(chunkNameComment);
}

function moduleToChunk(str: string) {
  if (typeof str !== 'string') return '';
  return str
    .replace(JS_PATH_REGEXP, '')
    .replace(WEBPACK_PATH_NAME_NORMALIZE_REPLACE_REGEX, '-')
    .replace(WEBPACK_MATCH_PADDED_HYPHENS_REPLACE_REGEX, '');
}

function replaceTemplateSpan(str: string, stripLeftHyphen: boolean) {
  if (!str) {
    return '';
  }

  const result = str.replace(WEBPACK_PATH_NAME_NORMALIZE_REPLACE_REGEX, '-');
  if (!stripLeftHyphen) {
    return result;
  }

  return result.replace(MATCH_LEFT_HYPHENS_REPLACE_REGEX, '');
}

function transformTemplateSpan(span: TemplateSpan, first: boolean, single: boolean) {
  const chunkName = ts.createStringLiteral(
    single ? moduleToChunk(span.getFullText()) : replaceTemplateSpan(span.getFullText(), first),
  );
  return ts.createTemplateSpan(chunkName, span.literal);
}

function generateChunkNameNode(callPath: ts.CallExpression): ts.Expression {
  const importArg = getImportArg(callPath);

  if (ts.isTemplateExpression(importArg)) {
    const templateSpans = importArg.templateSpans.map((span, index) =>
      transformTemplateSpan(span, index === 0, importArg.templateSpans.length === 1),
    );

    return ts.createTemplateExpression(importArg.head, templateSpans);
  } else if (ts.isStringLiteral(importArg) || ts.isNoSubstitutionTemplateLiteral(importArg)) {
    return ts.createStringLiteral(moduleToChunk(importArg.text));
  }
  return importArg;
}

function getExistingChunkNameComment(callNode: ts.CallExpression) {
  const importArg = getImportArg(callNode);
  const values = getRawChunkNameFromCommments(importArg);
  return values;
}

function isAgressiveImport(callNode: ts.CallExpression) {
  const importArg = getImportArg(callNode);
  return ts.isTemplateExpression(importArg) && importArg.templateSpans.length > 0;
}

function addOrReplaceChunkNameComment(callNode: ts.CallExpression, ctx: ts.TransformationContext, values: any) {
  const importArg = getImportArg(callNode);

  removeMatchingLeadingComments(importArg, ctx, WEBPACK_CHUNK_NAME_REGEXP);

  ts.addSyntheticLeadingComment(
    importArg,
    ts.SyntaxKind.MultiLineCommentTrivia,
    writeWebpackCommentValues(values),
    false,
  );
}

function chunkNameFromTemplateExpression(node: TemplateExpression) {
  const [q1] = node.templateSpans;
  const v1 = q1.literal.text;
  if (!node.templateSpans.length) {
    return v1;
  }
  return `${v1}[request]`;
}

function sanitizeChunkNameTemplateExpression(node: TemplateExpression) {
  const identifier: string = (node.templateSpans[0].expression as any).text;

  return ts.createCall(
    ts.createPropertyAccess(
      ts.createTemplateExpression(ts.createTemplateHead(''), [
        ts.createTemplateSpan(ts.createIdentifier(identifier), ts.createTemplateTail('')),
      ]),
      ts.createIdentifier('replace'),
    ),
    undefined,
    [ts.createRegularExpressionLiteral(WEBPACK_PATH_NAME_NORMALIZE_REPLACE_REGEX.source), ts.createStringLiteral('-')],
  );
}

function replaceChunkName({ callNode, ctx }: CreatePropertyOptions) {
  const agressiveImport = isAgressiveImport(callNode);
  const values = getExistingChunkNameComment(callNode);

  if (!agressiveImport && values) {
    addOrReplaceChunkNameComment(callNode, ctx, values);
    return ts.createStringLiteral(values.webpackChunkName);
  }

  let chunkNameNode = generateChunkNameNode(callNode);
  let webpackChunkName: string;

  if (ts.isTemplateExpression(chunkNameNode)) {
    webpackChunkName = chunkNameFromTemplateExpression(chunkNameNode);
    chunkNameNode = sanitizeChunkNameTemplateExpression(chunkNameNode);
  } else if (ts.isStringLiteral(chunkNameNode) || ts.isNoSubstitutionTemplateLiteral(chunkNameNode)) {
    webpackChunkName = chunkNameNode.text;
  } else {
    webpackChunkName = '';
  }

  addOrReplaceChunkNameComment(callNode, ctx, { webpackChunkName });
  return chunkNameNode;
}

export default function chunkNameProperty(options: CreatePropertyOptions) {
  const chunkNameExpression = replaceChunkName(options);
  const args = options.funcNode.parameters.map(p => p.getFullText());

  return createObjectMethod('chunkName', args, ts.createBlock([ts.createReturn(chunkNameExpression)], true));
}
