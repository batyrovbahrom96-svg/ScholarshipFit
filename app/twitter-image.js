// Twitter card uses the same visual as our OpenGraph image.
// (runtime intentionally left as Next default — ImageResponse works fine on it,
//  and this avoids the "can't statically re-export runtime" warning.)
import opengraphImage, { alt as ogAlt, size as ogSize, contentType as ogContentType } from './opengraph-image'

export const alt = ogAlt
export const size = ogSize
export const contentType = ogContentType
export default opengraphImage
