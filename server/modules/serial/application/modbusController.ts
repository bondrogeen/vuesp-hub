import Serial from './ServiceSerial.ts';
import type { Request, Response } from 'express';
import { sendApiError } from '@shared/http/apiResponse.ts';

export type ModbusSerial = Pick<Serial, 'getList' | 'writeAsync'>;

export const createModbusController = (serial: ModbusSerial) => ({
    async send(_req: Request, res: Response) {
        try {
            await serial.getList();
            const t = await serial.writeAsync([1, 4, 0, 0, 0, 1, 49, 202])

            res.status(200).json({ t });

        } catch (error) {
            console.error('Modbus API request failed:', error);
            sendApiError(res, 500, 'Internal server error');
        }
    },
});

export default () => createModbusController(new Serial());