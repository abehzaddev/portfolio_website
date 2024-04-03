import sanityClient from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = sanityClient({
    projectId: 'oyf22kt8',
    dataset: 'production',
    apiVersion: '2022-02-01',
    useCdn: true,
    token: 'skQJhIjJQX8lIOMarSAXbmpsPx3oRwAjqfVgdu2Cw9HkLSYak6vryiHa5tDJSg0rFoHkekYnzSUlQlnDnyhvTf9vDI7wx9q2pntYo5qwkLC2jTPRtsgEEC1yBDaHREvkgbXljkMAxX2p7x4lgDOuMNKFVIJaq7itzQzoYkdMjRyuwrY1iaY6',
})

const builder = imageUrlBuilder(client)

export const urlFor = (source) => builder.image(source)