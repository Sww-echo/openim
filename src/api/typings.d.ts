declare namespace API {
  declare namespace Login {
    enum UsedFor {
      Register = 1,
      Modify = 2,
      Login = 3,
    }
    type RegisterUserInfo = {
      nickname: string;
      faceURL: string;
      birth?: number;
      gender?: number;
      email?: string;
      account?: string;
      areaCode: string;
      phoneNumber?: string;
      password: string;
    };
    type DemoRegisterType = {
      enterpriseCode?: string;
      invitationCode?: string;
      verifyCode?: string;
      deviceID?: string;
      autoLogin?: boolean;
      user: RegisterUserInfo;
    };
    type LoginParams = {
      deviceID?: string;
      phoneNumber: string;
      areaCode: string;
      account?: string;
      password: string;
      enterpriseCode?: string;
      invitationCode?: string;
    };
    type ModifyParams = {
      userID: string;
      currentPassword: string;
      newPassword: string;
    };
    type ResetParams = {
      email?: string;
      phoneNumber?: string;
      areaCode: string;
      verifyCode: string;
      password: string;
      serial?: string;
    };
    type VerifyCodeParams = {
      email?: string;
      phoneNumber?: string;
      areaCode: string;
      verifyCode: string;
      usedFor: UsedFor;
      enterpriseCode?: string;
      invitationCode?: string;
    };
    type SendSmsParams = {
      email?: string;
      phoneNumber?: string;
      areaCode: string;
      deviceID?: string;
      usedFor: UsedFor;
      enterpriseCode?: string;
      invitationCode?: string;
    };
  }
}
