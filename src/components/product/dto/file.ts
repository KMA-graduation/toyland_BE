export class File {
  filename: string;
  data: ArrayBuffer;
  encoding: string;
  mimetype: string;
  limit: boolean;
}

export class FileUpload extends File {
  mimetype: string;
}
