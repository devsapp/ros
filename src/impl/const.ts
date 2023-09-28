export const FC_CLIENT_CONNECT_TIMEOUT: number =
  parseInt(process.env.FC_CLIENT_CONNECT_TIMEOUT || '5') * 1000;

export const FC_CLIENT_READ_TIMEOUT: number =
  parseInt(process.env.FC_CLIENT_READ_TIMEOUT || '10') * 1000;
