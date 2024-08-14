/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { excelDateSerial, excelSerialToDate, getDateSerialNumberByObject, getTwoDateDaysByBasis } from '../../../basics/date';
import { ErrorType } from '../../../basics/error-type';
import { checkVariantsErrorIsArrayOrBoolean } from '../../../engine/utils/check-variant-error';
import { type BaseValueObject, ErrorValueObject } from '../../../engine/value-object/base-value-object';
import { NumberValueObject } from '../../../engine/value-object/primitive-object';
import { BaseFunction } from '../../base-function';

export class Coupdaybs extends BaseFunction {
    override minParams = 3;

    override maxParams = 4;

    override calculate(settlement: BaseValueObject, maturity: BaseValueObject, frequency: BaseValueObject, basis?: BaseValueObject) {
        const _basis = basis ?? NumberValueObject.create(0);

        const { isError, errorObject, variants } = checkVariantsErrorIsArrayOrBoolean(settlement, maturity, frequency, _basis);

        if (isError) {
            return errorObject as ErrorValueObject;
        }

        const [settlementObject, maturityObject, frequencyObject, basisObject] = variants as BaseValueObject[];

        const settlementSerialNumber = getDateSerialNumberByObject(settlementObject);

        if (typeof settlementSerialNumber !== 'number') {
            return settlementSerialNumber;
        }

        const maturitySerialNumber = getDateSerialNumberByObject(maturityObject);

        if (typeof maturitySerialNumber !== 'number') {
            return maturitySerialNumber;
        }

        const frequencyValue = Math.floor(+frequencyObject.getValue());
        const basisValue = Math.floor(+basisObject.getValue());

        if (Number.isNaN(frequencyValue) || Number.isNaN(basisValue)) {
            return ErrorValueObject.create(ErrorType.VALUE);
        }

        if (
            ![1, 2, 4].includes(frequencyValue) ||
            basisValue < 0 ||
            basisValue > 4 ||
            Math.floor(settlementSerialNumber) >= Math.floor(maturitySerialNumber)
        ) {
            return ErrorValueObject.create(ErrorType.NUM);
        }

        const settlementDate = excelSerialToDate(settlementSerialNumber);
        const coupDate = excelSerialToDate(maturitySerialNumber);

        coupDate.setUTCFullYear(settlementDate.getUTCFullYear());

        if (coupDate < settlementDate) {
            coupDate.setUTCFullYear(coupDate.getUTCFullYear() + 1);
        }

        // eslint-disable-next-line
        while (coupDate > settlementDate) {
            coupDate.setUTCMonth(coupDate.getUTCMonth() - 12 / frequencyValue);
        }

        let coupDateSerialNumber = excelDateSerial(coupDate);

        // special handle for excel
        if (coupDateSerialNumber < 0) {
            coupDateSerialNumber = 0;
        }

        const { days } = getTwoDateDaysByBasis(coupDateSerialNumber, settlementSerialNumber, basisValue);

        return NumberValueObject.create(days);
    }
}