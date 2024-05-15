import axios from 'axios';
import axiosFetchAdapter from '@vespaiach/axios-fetch-adapter';

import loginPage from './pages/login';
import wolPage from './pages/wol';

const Page = (page) => new Response(page, {
	headers: {
		'Content-Type': 'text/html'
	}
});

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const pathParams = pathname.split('/').slice(1);
		const query = Object.fromEntries(url.searchParams.entries());
		const cookies = Object.fromEntries(new URLSearchParams(request.headers.get('Cookie') || '').entries());
		const body = Object.fromEntries(new URLSearchParams(await request.text()).entries());

		const apiKey = env.API_KEY;
		const host = env.IPTIME_HOST;
		const username = env.IPTIME_USER;
		const passwd = env.IPTIME_PW;
		const useLogin = env.USE_LOGIN === 'true';

		const isRoot = !pathParams[0];
		let authorized = (request.method === 'GET' && query.key === apiKey)
			|| request.headers.get('Authorization') === apiKey
			|| cookies.key === apiKey;

		if(!authorized) {
			if(isRoot) {
				if(useLogin) return Page(loginPage());
				else authorized = true;
			}
			else if(pathParams[0] !== 'login') return new Response('Unauthorized', { status: 401 });
		}

		let api = axios.create({
			baseURL: host,
			adapter: axiosFetchAdapter
		});

		const { data: session } = await api.post('/sess-bin/login_handler.cgi', new URLSearchParams({
			username,
			passwd,
			act: 'session_id',
			captcha_on: 0
		}).toString(), {
			headers: {
				Referer: `${host}/sess-bin/login_handler.cgi`,
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});

		api = axios.create({
			baseURL: host,
			adapter: axiosFetchAdapter,
			headers: {
				cookie: `efm_session_id=${session}`,
				Referer: host
			}
		});

		let _devicesCache;
		const getDevices = async () => {
			if(_devicesCache) return _devicesCache;

			const { data: result } = await api.get('/sess-bin/info.cgi', {
				params: {
					act: 'wol_list'
				}
			});

			return _devicesCache = result.trim().split('\n').map(a => a.split(';')).map(a => ({
				name: a[1],
				mac: a[0].replaceAll('-', ':')
			}));
		}

		switch(pathParams[0]) {
			case '': {
				const devices = await getDevices();

				return Page(wolPage(env, devices));
			}
			case 'login': {
				cookies.key = body.password;

				return new Response(null, {
					status: 302,
					headers: {
						Location: '/',
						'Set-Cookie': `${new URLSearchParams(cookies).toString()}; Max-Age=3600;`
					}
				});
			}
			case 'api': switch(pathParams[1]) {
				case 'wol': {
					if(pathParams.length !== 3) return new Response('Bad Request', { status: 400 });

					console.log(session);

					const { data: result } = await api.get('/sess-bin/wol_apply.cgi', {
						params: {
							act: 'wakeup',
							mac: pathParams[2]
						}
					});

					return new Response(result);
				}
				case 'devices': {
					const devices = await getDevices();

					return Response.json(JSON.stringify(devices));
				}
			}
		}

		return new Response('Not found', { status: 404 });
	}
}