import Str from 'expensify-common/lib/str';
import _ from 'lodash';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';
import type {Transaction} from '@src/types/onyx';
import type {ReceiptError} from '@src/types/onyx/Transaction';
import {splitExtensionFromFileName} from './fileDownload/FileUtils';

type ThumbnailAndImageURI = {
    image?: string;
    thumbnail?: string;
    transaction?: Transaction;
    isLocalFile?: boolean;
    isThumbnail?: boolean;
    fileExtension?: string;
};

/**
 * Grab the appropriate receipt image and thumbnail URIs based on file type
 *
 * @param transaction
 * @param receiptPath
 * @param receiptFileName
 */
function getThumbnailAndImageURIs(transaction: Transaction, receiptPath: string | null = null, receiptFileName: string | null = null): ThumbnailAndImageURI {
    if (Object.hasOwn(transaction?.pendingFields ?? {}, 'waypoints')) {
        return {isThumbnail: true, isLocalFile: true};
    }
    // If there're errors, we need to display them in preview. We can store many files in errors, but we just need to get the last one
    const errors = _.findLast(transaction.errors) as ReceiptError | undefined;
    // URI to image, i.e. blob:new.expensify.com/9ef3a018-4067-47c6-b29f-5f1bd35f213d or expensify.com/receipts/w_e616108497ef940b7210ec6beb5a462d01a878f4.jpg
    const path = errors?.source ?? transaction?.receipt?.source ?? receiptPath ?? '';
    // filename of uploaded image or last part of remote URI
    const filename = errors?.filename ?? transaction?.filename ?? receiptFileName ?? '';
    const isReceiptImage = Str.isImage(filename);
    const hasEReceipt = transaction?.hasEReceipt;

    if (hasEReceipt) {
        return {image: ROUTES.ERECEIPT.getRoute(transaction.transactionID), transaction};
    }

    // For local files, we won't have a thumbnail yet
    if (isReceiptImage && (path.startsWith('blob:') || path.startsWith('file:'))) {
        return {image: path, isLocalFile: true};
    }

    if (isReceiptImage) {
        return {thumbnail: `${path}.1024.jpg`, image: path};
    }

    const isLocalFile = typeof path === 'number' || path.startsWith('blob:') || path.startsWith('file:') || path.startsWith('/');
    const {fileExtension} = splitExtensionFromFileName(filename);
    return {isThumbnail: true, fileExtension: Object.values(CONST.IOU.FILE_TYPES).find((type) => type === fileExtension), image: path, isLocalFile};
}

// eslint-disable-next-line import/prefer-default-export
export {getThumbnailAndImageURIs};
export type {ThumbnailAndImageURI};
