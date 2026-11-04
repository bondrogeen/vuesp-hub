import { Router } from 'express';
import AxiosDigestAuth from '@mhoc/axios-digest-auth';

const router = Router();


const fetch = ({ username, password }: { username: string; password: string }) => (url: string) =>
  new AxiosDigestAuth({ username, password }).request({ url, method: 'GET' });

router.get('/*url', async (req, res) => {
    console.log(req.params);
    const url = Array.isArray(req.params.url) ? req.params.url.join('/') : req.params.url;
    console.log(url);
    const get = fetch({ username: 'admin', password: 'admin' })
    const { data } = await get(`http://${url}`);
    return res.send(data);
});

export default router;