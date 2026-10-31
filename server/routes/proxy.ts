import { Router } from 'express';
import AxiosDigestAuth from '@mhoc/axios-digest-auth';

const router = Router();


const fetch = ({ username, password }) => options => new AxiosDigestAuth({ username, password }).request(options);

router.get('/*url', async (req, res) => {
    console.log(req.params);
    const url = Array.isArray(req.params.url) ? req.params.url.join('/') : req.params.url;
    console.log(url);
    const get = fetch({ username: 'admin', password: 'admin' })
    const { data } = await get({ url: `http://${url}` });
    return res.send(data);
});

export default router;