export type LocalUserRecord = {
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'admin' | 'contestant';
  teamId?: string;
  displayName?: string;
};

export const USERS: LocalUserRecord[] = [
  {
    email: 'agentalpha@foss.ops',
    passwordHash:
      'f5be920059aa4159adfd857b27e0c63c61fc093ec93e8eb0bb68b8f8d49b85ae5fdc2a8d48b38c9cd08a732b2a311d6b7f3bc51e1d9a5bf51bcbdc50f571a0fb',
    passwordSalt: '02ca5044ab53841f386526fde23f8757',
    role: 'admin',
    displayName: 'Agent Alpha',
  },
  {
    email: 'agentalpha.fossops',
    passwordHash:
      '6ab704f214759623e047c684971825dff2b5c43f5a637424b026a893c08e6e284f98d018e84c0474df8335548fe9de68f1f6d511c23f4e8e2a786bfb7e87e088',
    passwordSalt: 'e2493716fb64a295757f91555b5dc387',
    role: 'contestant',
    displayName: 'Agent Alpha',
  },
  {
    email: 'agentbravo.fossops',
    passwordHash:
      '9f38139b9c714294220cbed9afbed4313e4f410cd531619e51f4ad5d4fdc0a388cd59930ffb98a3bec898ec227317919b45c4f7a90fb4ba723306613def42b53',
    passwordSalt: '13be407af25d102bdde1e9439cacf2c7',
    role: 'contestant',
    displayName: 'Agent Bravo',
  },
  {
    email: 'agentcharlie.fossops',
    passwordHash:
      '2c56abdc643bb948ba89fa46eab05ad55eb1150cd60ece5bb10f137debe8b5357ea589ec682a07d50eec074f262b44d5277ea0f1c7705057c9491bba5904902d',
    passwordSalt: '37ca51a5a35d1a1beea8cb86a71e1bf6',
    role: 'contestant',
    displayName: 'Agent Charlie',
  },
  {
    email: 'agentdelta.fossops',
    passwordHash:
      '01226f940d7e70fe48ea03173120690d4cddd53cb34f074655b394f104b1c5335b47cb0404c884cff718168660cbbb0a565b8af653cdf15fa8fb1c0768ff0895',
    passwordSalt: '1e66be4e6f9929c6111012ca80e59273',
    role: 'contestant',
    displayName: 'Agent Delta',
  },
  {
    email: 'agentecho.fossops',
    passwordHash:
      '821eb5ba2f46bedb9f0489e63e3cbd730ca3890fb9eaa93c1788471c132e1ccb9b24cfb56fc8c510a7a02e69f54fc74b68eab4a4e4ddb753efc11191d3519187',
    passwordSalt: 'f835bc3880620b1a1983dcaebe71af51',
    role: 'contestant',
    displayName: 'Agent Echo',
  },
  {
    email: 'agenttest@foss.ops',
    passwordHash:
      '7f637398ddab0918c8cae2c896628deae2237e450075eb0b73d6a108d35354510178bfa0af73774a438991d44545bda13ed2617db4870a541726469a0dd4aed0',
    passwordSalt: '7e184640776343c20083d2d6ab66f231',
    role: 'contestant',
    displayName: 'Agent Test',
  },
];
