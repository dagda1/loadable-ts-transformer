/* eslint-disable jest/no-focused-tests */
import ts from 'typescript';
import { loadableTransformer } from './';

function testTransformer(source: string) {
  return ts.transpileModule(source, {
    transformers: {
      before: [loadableTransformer],
    },
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
}

describe('transformer', () => {
  describe('simple import', () => {
    it('should work with template literal', () => {
      const result = testTransformer(`
        loadable(() => import(\`./ModA\`))
      `);

      expect(result).toMatchSnapshot();
    });

    it('should work with + concatenation', () => {
      const result = testTransformer(`
        loadable(() => import('./Mod' + 'A'))
      `);

      expect(result).toMatchSnapshot();
    });

    it('should work with * in name', () => {
      const result = testTransformer(`
        loadable(() => import(\`./foo*\`))
      `);

      expect(result).toMatchSnapshot();
    });

    it('should transform path into "chunk-friendly" name', () => {
      const result = testTransformer(`
        loadable(() => import('../foo/bar'))
      `);

      expect(result).toMatchSnapshot();
    });

    describe('with "webpackChunkName" comment', () => {
      it('should use it', () => {
        const result = testTransformer(`
          loadable(() => import(/* webpackChunkName: "ChunkA" */ './ModA'))
        `);

        expect(result).toMatchSnapshot();
      });

      it('should use it even if comment is separated by ","', () => {
        const result = testTransformer(`
          loadable(() => import(/* webpackPrefetch: true, webpackChunkName: "ChunkA" */ './ModA'))
        `);

        expect(result).toMatchSnapshot();
      });
    });

    describe('without "webpackChunkName" comment', () => {
      it('should add it', () => {
        const result = testTransformer(`
          loadable(() => import('./ModA'))
        `);

        expect(result).toMatchSnapshot();
      });
    });

    describe('in a complex promise', () => {
      it('should work', () => {
        const result = testTransformer(`
          loadable(() => timeout(import('./ModA'), 2000))
        `);

        expect(result).toMatchSnapshot();
      });
    });
  });

  describe('aggressive import', () => {
    it('should work with destructuration', () => {
      const result = testTransformer(`
        loadable(({ foo }) => import(/* webpackChunkName: "Pages" */ \`./\${foo}\`))
      `);
      expect(result).toMatchSnapshot();
    });

    describe('with "webpackChunkName"', () => {
      it('should replace it', () => {
        const result = testTransformer(`
          loadable(props => import(/* webpackChunkName: "Pages" */ \`./\${props.foo}\`))
        `);

        expect(result).toMatchSnapshot();
      });
    });

    describe('without "webpackChunkName"', () => {
      it('should support simple request', () => {
        const result = testTransformer(`
          loadable(props => import(\`./\${props.foo}\`))
        `);

        expect(result).toMatchSnapshot();
      });

      it('should support complex request', () => {
        const result = testTransformer(`
          loadable(props => import(\`./dir/\${props.foo}/test\`))
        `);

        expect(result).toMatchSnapshot();
      });

      it('should support destructuring', () => {
        const result = testTransformer(`
          loadable(({ foo }) => import(\`./dir/\${foo}/test\`))
        `);

        expect(result).toMatchSnapshot();
      });
    });
  });

  describe('loadable.lib', () => {
    it('should be transpiled too', () => {
      const result = testTransformer(`
        loadable.lib(() => import('moment'))
      `);

      expect(result).toMatchSnapshot();
    });
  });

  describe.only('Magic comment', () => {
    it.only('should transpile shortand properties', () => {
      const result = testTransformer(`
        const obj = {
          /* #__LOADABLE__ */
          load() {
            return import('moment')
          }
        }
      `);

      expect(result).toMatchSnapshot();
    });

    it('should transpile arrow functions', () => {
      const result = testTransformer(`
        const load = /* #__LOADABLE__ */ () => import('moment')
      `);

      expect(result).toMatchSnapshot();
    });

    it('should transpile function expression', () => {
      const result = testTransformer(`
        const load = /* #__LOADABLE__ */ function () {
          return import('moment')
        }
      `);
      expect(result).toMatchSnapshot();
    });

    it('should remove only needed comments', () => {
      const result = testTransformer(`
        const load = /* #__LOADABLE__ */ /* IMPORTANT! */ () => import('moment')
      `);

      expect(result).toMatchSnapshot();
    });
  });
});
