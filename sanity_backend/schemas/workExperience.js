export default {
    name:'workExperience',
    title:'Work Experience',
    type:'document',
    fields:[
           {name:'name',
               title:'name',
               type:'string'
            },
            {
                name:'company',
                title:'Company',
                type:'string'
            },
            {
                name:'desc',
                title:'Desc',
                type:'string'
            },
            {
                name:'highlight',
                title:'Highlight on the commit log (bigger entry, always expanded)',
                type:'boolean'
            },
            {
                name:'start',
                title:'Start date (optional)',
                type:'date',
                options:{ dateFormat:'MMM YYYY' }
            },
            {
                name:'end',
                title:'End date (optional — leave empty with a start date for "Present")',
                type:'date',
                options:{ dateFormat:'MMM YYYY' }
            }
    ]
}