export type ApplicationNote = {
  id: string;
  applicationId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

// Raw row shape from Supabase (snake_case columns)
export type NoteRow = {
  id: string;
  application_id: string;
  author_email: string;
  body: string;
  created_at: string;
  updated_at: string;
};
