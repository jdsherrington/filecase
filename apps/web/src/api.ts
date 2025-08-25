import ky from 'ky';

const api = ky.create({
  prefixUrl: 'http://localhost:3001',
});

const userApi = {
  users: {
    getMe: async ({ token }: { token: string }) => {
      return await api.get('users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).json();
    },
    updateMe: async ({
      token,
      data,
    }: {
      token: string;
      data: { firstName: string; lastName: string };
    }) => {
      return await api.patch('users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        json: data,
      }).json();
    },
  },
  orgs: {
    check: async ({ token }: { token: string }) => {
      return await api.get('orgs/check', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).json();
    },
    create: async ({
      token,
      data,
    }: {
      token: string;
      data: { name: string };
    }) => {
      return await api.post('orgs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        json: data,
      }).json();
    },
  },
};

export { userApi as api };
