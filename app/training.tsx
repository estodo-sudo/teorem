import { Redirect } from 'expo-router';

/** The Antrenman tab was folded into Günüm and Profil (SPEC_V4 §A.1); old links and notifications land on Günüm. */
export default function TrainingRedirect() {
  return <Redirect href="/" />;
}
