export default {
    name: 'works',
    title: 'Works',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
      },
    
      {
        name: 'description',
        title: 'Description',
        type: 'string',
      },
      {
        name: 'projectLink',
        title: 'Project Link',
        type: 'string',
      },
      {
        name: 'codeLink',
        title: 'Code Link',
        type: 'string',
      },
      {
        name: 'imgUrl',
        title: 'ImageUrl',
        type: 'image',
        options: {
          hotspot: true,
        },
      },
   
      {
        name: 'role',
        title: 'Role (shown on the timeline)',
        type: 'string',
      },
      {
        name: 'start',
        title: 'Start date (projects without one stay off the timeline)',
        type: 'date',
        options: { dateFormat: 'MMM YYYY' },
      },
      {
        name: 'end',
        title: 'End date (leave empty for ongoing)',
        type: 'date',
        options: { dateFormat: 'MMM YYYY' },
      },
      {
        name: 'tags',
        title: 'Tags',
       type:'array',
       of: [
         {
           name:'tag',
           title:'Tag',
           type:'string'
         }
       ]
      },
     
    ],
  };