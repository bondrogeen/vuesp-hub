export interface TargetMenuSpeaker {
  id: string;
  name: string;
}

export interface TargetMenuAccount {
  id: string;
  name: string;
  speakers: TargetMenuSpeaker[];
}

export interface TargetMenuProps {
  accounts: TargetMenuAccount[];
  selectedAccount: string;
  selectedSpeaker: string;
}

export interface TargetMenuEmits {
  select: [accountId: string, speakerId: string];
}
