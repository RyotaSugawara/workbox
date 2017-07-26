/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import ErrorFactory from '../../../../lib/error-factory';

const errors = {
  'unit-must-be-bytes': `The 'unit' portion of the Range header must be set to
    'bytes'.`,
  'single-range-only': `Multiple ranges are not supported. Please provide a
    single start value, and optional end value.`,
};

export default new ErrorFactory(errors);
