/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import * as path from 'path';
import {terser} from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';
import serve from 'rollup-plugin-serve';

const sourcemap = false;

function getPlugins(options) {
  let plugins = [];

  if (options.useCustomTfjs) {
    plugins.push(
        // replace top level imports to tfjs-core with custom import.
        // after v3 is out we still need to do this in converter.
        alias({
          entries: [
            {
              find: /@tensorflow\/tfjs$/,
              replacement: path.resolve(__dirname, options.customTfjsPath),
            },
            {
              find: /@tensorflow\/tfjs-core$/,
              replacement: path.resolve(__dirname, options.customTfjsCorePath),
            },
            {
              find: '/@tensorflow/tfjs-core/dist/ops/ops_for_converter',
              replacement: path.resolve(__dirname, options.customOpsPath),
            },
          ],
        }));
  }

  plugins = [
    ...plugins,
    resolve({browser: true, dedupe: ['seedrandom']}),
    commonjs({include: ['node_modules/**']}),
    terser({output: {comments: false}}),
    serve(),
  ];

  if (options.visualize) {
    plugins.push(visualizer({sourcemap, filename: options.visPath}));
  }

  return plugins;
}

function makeBundle(useCustomTfjs) {
  const outputPath = useCustomTfjs ? 'dist/custom' : 'dist/full';
  return {
    input: 'index.js',
    output: {
      file: `${outputPath}/index_rollup.js`,
      sourcemap,
      format: 'umd',
    },
    plugins: [
      ...getPlugins({
        useCustomTfjs: useCustomTfjs,
        customTfjsPath: './custom_tfjs_blazeface/custom_tfjs.js',
        customTfjsCorePath: './custom_tfjs_blazeface/custom_tfjs_core.js',
        customOpsPath:
        './custom_tfjs_blazeface/custom_ops_for_converter.js',
        visualize: true,
        visPath: `${outputPath}/index_rollup.js.html`,
      }),
    ],
  };
}

module.exports = [
  makeBundle(true /* use custom tfjs */),
  makeBundle(false /* don't use custom tfjs */),
];
