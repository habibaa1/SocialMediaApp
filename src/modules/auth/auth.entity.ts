export interface ILoginResponse {
  Access_Token: string;
  Refresh_Token: string;
}

export interface ISignupResponse extends ILoginResponse {
  username: string;
  _id: string;
}
