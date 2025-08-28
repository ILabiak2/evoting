export enum ElectionType {
  PUBLIC_SINGLE_CHOICE = 'public_single_choice',
  PRIVATE_SINGLE_CHOICE = 'private_single_choice',
  PUBLIC_MULTI_CHOICE = 'public_multi_choice',
  PRIVATE_MULTI_CHOICE = 'private_multi_choice',
}

export const ElectionTypeFromNumber: Record<number, ElectionType> = {
  0: ElectionType.PUBLIC_SINGLE_CHOICE,
  1: ElectionType.PRIVATE_SINGLE_CHOICE,
  2: ElectionType.PUBLIC_MULTI_CHOICE,
  3: ElectionType.PRIVATE_MULTI_CHOICE
};
