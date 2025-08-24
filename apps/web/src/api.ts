import ky from 'ky';

const api = {
  users: {
    getMe: async () => {
      return await ky.get('/api/users/me').json();
    },
    updateMe: async (data: { firstName: string; lastName: string }) => {
      return await ky.patch('/api/users/me', { json: data }).json();
    },
  },
};

export { api };
