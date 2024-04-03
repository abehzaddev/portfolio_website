export default {
    name: 'resumeUpload', // Unique name for the schema
    title: 'Resume Upload', // Human-readable title
    type: 'document', // Type of schema is a document
    fields: [
      {
        name: 'title', // A title for the PDF document
        title: 'Title',
        type: 'string', // Type of this field is string
      },
      {
        name: 'resume', // Field for the PDF file
        title: 'Resume',
        type: 'file', // Field type is file
        options: {
          accept: '.pdf', // Only accept PDF files
        },
      },
    ],
  };