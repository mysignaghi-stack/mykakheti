import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'სერვისები / მომსახურების მიმწოდებლები კახეთში | MyKakheti.ge',
  description: 'იპოვეთ ადგილობრივი სერვისები და მომსახურების მიმწოდებლები კახეთში. დაამატეთ თქვენი სერვისი და მიაწოდეთ მომხმარებლებს ინფორმაცია თქვენი მომსახურების შესახებ.',
};

export default function MastersLayout({ children }: { children: ReactNode }) {
  return children;
}
