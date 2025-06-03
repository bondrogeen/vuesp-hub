import { Router } from 'express';
import AxiosDigestAuth from '@mhoc/axios-digest-auth';

import { storeModel } from '../models/index.mjs';

const router = Router();
const model = storeModel('device');


const fetch = ({ username, password }) => options => new AxiosDigestAuth({ username, password }).request(options);

router.get('/*', async (req, res) => {
    console.log(req.params);
    const url = req?.params?.[0];
    console.log(url);
    const get = fetch({ username: 'admin', password: 'admin' })
    const { data } = await get({ url: `http://${url}` });
    return res.send(data);
});

export default router;