const bcrypt = require('bcrypt');
const saltRounds = 10;

export const hashPasswordHelper = async (plainPassword: string) => {
  try {
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    return hash;
  } catch (error) {
    console.log(error);
  }
};

export const comparePasswordHelper = async (
  plainPassword: string,
  hash: string,
) => {
  try {
    const match = await bcrypt.compare(plainPassword, hash);
    return match;
  } catch (error) {
    console.log(error);
  }
};
