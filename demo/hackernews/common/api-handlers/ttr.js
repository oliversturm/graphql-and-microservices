import jsonwebtoken from 'jsonwebtoken';
import jwtSecret from '../../auth/jwt_secret';
import { handleTtr } from 'talk-to-resolve/api-handler/ttr';

export default async (req, res) => {
  await handleTtr(req, res, jwtToken => {
    // Make sure the web token is valid for TTR - the details of
    // the validation are just an example, you can change this.
    const jwt = jsonwebtoken.verify(jwtToken, jwtSecret);
    if (!jwt || !jwt.id) throw new Error('Invalid authentication token');
    if (!jwt || !jwt.roles || jwt.roles.indexOf('$ttr') < 0)
      throw new Error('Missing role');
  });
};
