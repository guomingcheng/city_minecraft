// Type definitions for node-telegram-bot-api 0.57
// Project: https://github.com/yagop/node-telegram-bot-api
// Definitions by: Alex Muench <https://github.com/ammuench>
//                 Agadar <https://github.com/agadar>
//                 Giorgio Garasto <https://github.com/Dabolus>
//                 XC-Zhang <https://github.com/XC-Zhang>
//                 AdityaThebe <https://github.com/adityathebe>
//                 Michael Orlov <https://github.com/MiklerGM>
//                 XieJiSS <https://github.com/XieJiSS>
//                 Toniop <https://github.com/toniop99>
//                 Konstantin24121 <https://github.com/konstantin24121>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

/// <reference types="node" />

import { ServerOptions } from 'https';
import { Options } from 'request';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Stream } from 'stream';

import errors from 'errors';
import debug from 'debug';
import axios from 'axios';
import deprecate from 'depd';
import stream from 'stream';
import URL from 'url';
import qs from 'querystring';
import fs from 'fs';
import path from 'path';
const fileType = require('file-type');
// import fileType from 'file-type';
import mime from 'mime';
import pump from 'pump';
import streamedRequest from 'request';

declare namespace TelegramBot {
  interface TextListener {
    regexp: RegExp;
    callback(msg: Message, match: RegExpExecArray | null): void;
  }

  interface ReplyListener {
    id: number;
    chatId: ChatId;
    messageId: number | string;
    callback(msg: Message): void;
  }

  type ChatType = 'private' | 'group' | 'supergroup' | 'channel';

  type ChatAction =
    | 'typing'
    | 'upload_photo'
    | 'record_video'
    | 'upload_video'
    | 'record_voice'
    | 'upload_voice'
    | 'upload_document'
    | 'find_location'
    | 'record_video_note'
    | 'upload_video_note';

  type ChatMemberStatus =
    | 'creator'
    | 'administrator'
    | 'member'
    | 'restricted'
    | 'left'
    | 'kicked';

  type DocumentMimeType = 'application/pdf' | 'application/zip';

  type MessageType =
    | 'text'
    | 'animation'
    | 'audio'
    | 'channel_chat_created'
    | 'contact'
    | 'delete_chat_photo'
    | 'document'
    | 'game'
    | 'group_chat_created'
    | 'invoice'
    | 'left_chat_member'
    | 'location'
    | 'migrate_from_chat_id'
    | 'migrate_to_chat_id'
    | 'new_chat_members'
    | 'new_chat_photo'
    | 'new_chat_title'
    | 'passport_data'
    | 'photo'
    | 'pinned_message'
    | 'sticker'
    | 'successful_payment'
    | 'supergroup_chat_created'
    | 'video'
    | 'video_note'
    | 'voice'
    | 'video_chat_started'
    | 'video_chat_ended'
    | 'video_chat_participants_invited'
    | 'video_chat_scheduled'
    | 'message_auto_delete_timer_changed'
    | 'chat_invite_link'
    | 'chat_member_updated'
    | 'web_app_data';

  type MessageEntityType =
    | 'mention'
    | 'hashtag'
    | 'cashtag'
    | 'bot_command'
    | 'url'
    | 'email'
    | 'phone_number'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'code'
    | 'pre'
    | 'text_link'
    | 'text_mention'
    | 'spoiler';

  type ParseMode = 'Markdown' | 'MarkdownV2' | 'HTML';

  /// METHODS OPTIONS ///
  interface PollingOptions {
    interval?: string | number | undefined;
    autoStart?: boolean | undefined;
    params?: GetUpdatesOptions | undefined;
  }

  interface WebHookOptions {
    host?: string | undefined;
    port?: number | undefined;
    key?: string | undefined;
    cert?: string | undefined;
    pfx?: string | undefined;
    autoOpen?: boolean | undefined;
    https?: ServerOptions | undefined;
    healthEndpoint?: string | undefined;
  }

  interface ConstructorOptions {
    polling?: boolean | PollingOptions | undefined;
    webHook?: boolean | WebHookOptions | undefined;
    onlyFirstMatch?: boolean | undefined;
    request?: Options | undefined;
    baseApiUrl?: string | undefined;
    filepath?: boolean | undefined;
    httpsAgent?: SocksProxyAgent;
  }

  interface StartPollingOptions extends ConstructorOptions {
    restart?: boolean | undefined;
  }

  interface StopPollingOptions {
    cancel?: boolean | undefined;
    reason?: string | undefined;
  }

  interface SetWebHookOptions {
    url?: string | undefined;
    certificate?: string | Stream | undefined;
    max_connections?: number | undefined;
    allowed_updates?: string[] | undefined;
  }

  interface GetUpdatesOptions {
    offset?: number | undefined;
    limit?: number | undefined;
    timeout?: number | undefined;
    allowed_updates?: string[] | undefined;
  }

  interface SendBasicOptions {
    disable_notification?: boolean | undefined;
    reply_to_message_id?: number | undefined;
    reply_markup?:
      | InlineKeyboardMarkup
      | ReplyKeyboardMarkup
      | ReplyKeyboardRemove
      | ForceReply
      | undefined;
    protect_content?: boolean | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    chat_id?: string | number;
    game_short_name?: string | undefined;
  }

  interface SendMessageOptions extends SendBasicOptions {
    parse_mode?: ParseMode | undefined;
    disable_web_page_preview?: boolean | undefined;
    text?: string | undefined;
  }

  interface AnswerInlineQueryOptions {
    cache_time?: number | undefined;
    is_personal?: boolean | undefined;
    next_offset?: string | undefined;
    switch_pm_text?: string | undefined;
    switch_pm_parameter?: string | undefined;
    inline_query_id?: string | undefined;
    results?: string | undefined;
  }

  interface MessageBasic {
    chat_id?: string | number | undefined;
    from_chat_id?: string | number | undefined;
    message_id?: string | number | undefined;
  }

  interface ForwardMessageOptions extends MessageBasic {
    disable_notification?: boolean | undefined;
    protect_content?: boolean | undefined;
  }

  interface SendPhotoOptions extends SendBasicOptions {
    parse_mode?: ParseMode | undefined;
    caption?: string | undefined;
  }

  interface FileOptions {
    filename?: string | undefined;
    contentType?: string | undefined;
  }

  interface SendAudioOptions extends SendBasicOptions {
    parse_mode?: ParseMode | undefined;
    caption?: string | undefined;
    duration?: number | undefined;
    performer?: string | undefined;
    title?: string | undefined;
    thumb?: any;
  }

  interface SendAnimationOptions extends SendBasicOptions {
    parse_mode?: ParseMode | undefined;
    caption?: string | undefined;
    duration?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
  }

  interface SendDocumentOptions extends SendBasicOptions {
    parse_mode?: ParseMode | undefined;
    caption?: string | undefined;
  }

  interface SendMediaGroupOptions {
    disable_notification?: boolean | undefined;
    reply_to_message_id?: number | undefined;
  }

  interface SendPollOptions extends SendBasicOptions {
    is_anonymous?: boolean | undefined;
    type?: PollType | undefined;
    allows_multiple_answers?: boolean | undefined;
    correct_option_id?: number | undefined;
    explanation?: string | undefined;
    explanation_parse_mode?: ParseMode | undefined;
    open_period?: number | undefined;
    close_date?: number | undefined;
    is_closed?: boolean | undefined;
    question?: string | undefined;
    options?: string | undefined;
    //chat_id?: string | number | undefined;
    from_chat_id?: string | number | undefined;
    message_id?: string | number | undefined;
  }

  interface StopPollOptions extends MessageBasic {
    reply_markup?: InlineKeyboardMarkup | undefined;
  }

  type SendStickerOptions = SendBasicOptions;

  interface SendVideoOptions extends SendBasicOptions {
    parse_mode?: ParseMode | undefined;
    duration?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    caption?: string | undefined;
  }

  interface SendVoiceOptions extends SendBasicOptions {
    parse_mode?: ParseMode | undefined;
    caption?: string | undefined;
    duration?: number | undefined;
  }

  interface SendVideoNoteOptions extends SendBasicOptions {
    duration?: number | undefined;
    length?: number | undefined;
  }

  type SendLocationOptions = SendBasicOptions;

  type EditMessageLiveLocationOptions = EditMessageCaptionOptions;

  type StopMessageLiveLocationOptions = EditMessageCaptionOptions;

  interface SendVenueOptions extends SendBasicOptions {
    foursquare_id?: string | undefined;
    title?: string | undefined;
    address?: string | undefined;
  }

  interface SendContactOptions extends SendBasicOptions {
    last_name?: string | undefined;
    vcard?: string | undefined;
    phone_number?: string | undefined;
    first_name?: string | undefined;
  }

  type SendGameOptions = SendBasicOptions;

  interface SendInvoiceOptions extends SendBasicOptions {
    provider_data?: string | undefined;
    photo_url?: string | undefined;
    photo_size?: number | undefined;
    photo_width?: number | undefined;
    photo_height?: number | undefined;
    need_name?: boolean | undefined;
    need_phone_number?: boolean | undefined;
    need_email?: boolean | undefined;
    need_shipping_address?: boolean | undefined;
    is_flexible?: boolean | undefined;
  }

  interface CopyMessageOptions extends SendBasicOptions {
    caption?: string | undefined;
    parse_mode?: ParseMode | undefined;
    caption_entities?: MessageEntity[] | undefined;
    allow_sending_without_reply?: boolean | undefined;
    from_chat_id?: string | number;
    message_id?: string | number;
  }

  interface RestrictChatMemberOptions extends MessageBasic {
    until_date?: number | undefined;
    can_send_messages?: boolean | undefined;
    can_send_media_messages?: boolean | undefined;
    can_send_polls?: boolean | undefined;
    can_send_other_messages?: boolean | undefined;
    can_add_web_page_previews?: boolean | undefined;
    can_change_info?: boolean | undefined;
    can_invite_users?: boolean | undefined;
    can_pin_messages?: boolean | undefined;
    user_id?: string | undefined;
  }

  interface PromoteChatMemberOptions extends MessageBasic {
    can_change_info?: boolean | undefined;
    can_post_messages?: boolean | undefined;
    can_edit_messages?: boolean | undefined;
    can_delete_messages?: boolean | undefined;
    can_invite_users?: boolean | undefined;
    can_restrict_members?: boolean | undefined;
    can_pin_messages?: boolean | undefined;
    can_promote_members?: boolean | undefined;
    can_manage_video_chats?: boolean | undefined;
    user_id?: string | undefined;
  }

  interface AnswerCallbackQueryOptions {
    callback_query_id: string;
    text?: string | undefined;
    show_alert?: boolean | undefined;
    url?: string | undefined;
    cache_time?: number | undefined;
  }

  interface EditMessageTextOptions extends EditMessageCaptionOptions {
    parse_mode?: ParseMode | undefined;
    disable_web_page_preview?: boolean | undefined;
    text?: string | undefined;
  }

  interface EditMessageCaptionOptions extends EditMessageReplyMarkupOptions {
    reply_markup?: InlineKeyboardMarkup | undefined;
    parse_mode?: ParseMode | undefined;
    caption_entities?: MessageEntity[] | undefined;
    caption?: string | undefined;
    latitude: number | undefined;
    longitude?: number | undefined;
  }

  interface EditMessageReplyMarkupOptions {
    chat_id?: number | string | undefined;
    message_id?: number | undefined;
    inline_message_id?: string | undefined;
    reply_markup?: InlineKeyboardMarkup;
  }

  interface EditMessageMediaOptions {
    chat_id?: number | string | undefined;
    message_id?: number | undefined;
    inline_message_id?: string | undefined;
    reply_markup?: InlineKeyboardMarkup | undefined;
    media?: string | undefined;
  }

  interface GetUserProfilePhotosOptions {
    offset?: number | undefined;
    limit?: number | undefined;
    user_id?: string | number;
  }

  interface SetGameScoreOptions {
    force?: boolean | undefined;
    disable_edit_message?: boolean | undefined;
    chat_id?: number | undefined;
    message_id?: number | undefined;
    inline_message_id?: string | undefined;
    user_id: string | undefined;
    score: number | undefined;
  }

  interface GetGameHighScoresOptions {
    chat_id?: number | undefined;
    message_id?: number | undefined;
    inline_message_id?: string | undefined;
    user_id?: string | undefined;
  }

  interface AnswerShippingQueryOptions {
    shipping_options?: ShippingOption[] | undefined;
    error_message?: string | undefined;
  }

  interface AnswerPreCheckoutQueryOptions {
    error_message?: string | undefined;
  }

  interface SendDiceOptions extends SendBasicOptions {
    emoji?: string | undefined;
  }

  /// TELEGRAM TYPES ///
  interface PassportFile {
    file_id: string;
    file_size: number;
    file_date: number;
  }

  interface EncryptedPassportElement {
    type: string;
    data?: string | undefined;
    phone_number?: string | undefined;
    email?: string | undefined;
    files?: PassportFile[] | undefined;
    front_side?: PassportFile | undefined;
    reverse_side?: PassportFile | undefined;
    selfie?: PassportFile | undefined;
    translation?: PassportFile[] | undefined;
    hash: string;
  }

  interface EncryptedCredentials {
    data: string;
    hash: string;
    secret: string;
  }

  interface PassportData {
    data: EncryptedPassportElement[];
    credentials: EncryptedCredentials;
  }

  interface Update {
    update_id: number;
    message?: Message | undefined;
    edited_message?: Message | undefined;
    channel_post?: Message | undefined;
    edited_channel_post?: Message | undefined;
    inline_query?: InlineQuery | undefined;
    chosen_inline_result?: ChosenInlineResult | undefined;
    callback_query?: CallbackQuery | undefined;
    shipping_query?: ShippingQuery | undefined;
    pre_checkout_query?: PreCheckoutQuery | undefined;
    poll?: Poll | undefined;
    poll_answer?: PollAnswer | undefined;
    my_chat_member?: ChatMemberUpdated | undefined;
    chat_member?: ChatMemberUpdated | undefined;
    chat_join_request?: ChatJoinRequest | undefined;
  }

  interface WebhookInfo {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    ip_address?: string | undefined;
    last_error_date?: number | undefined;
    last_error_message?: string | undefined;
    last_synchronization_error_date?: number | undefined;
    max_connections?: number | undefined;
    allowed_updates?: string[] | undefined;
  }

  interface User {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string | undefined;
    username?: string | undefined;
    language_code?: string | undefined;
  }

  interface Chat {
    id: number;
    type: ChatType;
    title?: string | undefined;
    username?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    photo?: ChatPhoto | undefined;
    description?: string | undefined;
    invite_link?: string | undefined;
    pinned_message?: Message | undefined;
    permissions?: ChatPermissions | undefined;
    can_set_sticker_set?: boolean | undefined;
    sticker_set_name?: string | undefined;
    has_private_forwards?: boolean | undefined;
    has_protected_content?: boolean | undefined;
    slow_mode_delay?: number | undefined;
    message_auto_delete_time?: number | undefined;
    linked_chat_id?: number | undefined;
    /**
     * @deprecated since version Telegram Bot API 4.4 - July 29, 2019
     */
    all_members_are_administrators?: boolean | undefined;
  }

  interface Message {
    message_id: number;
    from?: User | undefined;
    date: number;
    chat: Chat;
    sender_chat?: Chat | undefined;
    forward_from?: User | undefined;
    forward_from_chat?: Chat | undefined;
    forward_from_message_id?: number | undefined;
    forward_signature?: string | undefined;
    forward_sender_name?: string | undefined;
    forward_date?: number | undefined;
    reply_to_message?: Message | undefined;
    edit_date?: number | undefined;
    media_group_id?: string | undefined;
    author_signature?: string | undefined;
    text?: string | undefined;
    entities?: MessageEntity[] | undefined;
    caption_entities?: MessageEntity[] | undefined;
    audio?: Audio | undefined;
    document?: Document | undefined;
    animation?: Animation | undefined;
    game?: Game | undefined;
    photo?: PhotoSize[] | undefined;
    sticker?: Sticker | undefined;
    video?: Video | undefined;
    voice?: Voice | undefined;
    video_note?: VideoNote | undefined;
    caption?: string | undefined;
    contact?: Contact | undefined;
    location?: Location | undefined;
    venue?: Venue | undefined;
    poll?: Poll | undefined;
    new_chat_members?: User[] | undefined;
    left_chat_member?: User | undefined;
    new_chat_title?: string | undefined;
    new_chat_photo?: PhotoSize[] | undefined;
    delete_chat_photo?: boolean | undefined;
    group_chat_created?: boolean | undefined;
    supergroup_chat_created?: boolean | undefined;
    channel_chat_created?: boolean | undefined;
    migrate_to_chat_id?: number | undefined;
    migrate_from_chat_id?: number | undefined;
    pinned_message?: Message | undefined;
    invoice?: Invoice | undefined;
    successful_payment?: SuccessfulPayment | undefined;
    connected_website?: string | undefined;
    passport_data?: PassportData | undefined;
    reply_markup?: InlineKeyboardMarkup | undefined;
    web_app_data?: WebAppData | undefined;
    is_automatic_forward?: boolean | undefined;
    has_protected_content?: boolean | undefined;
    dice?: Dice | undefined;
  }

  interface MessageEntity {
    type: MessageEntityType;
    offset: number;
    length: number;
    url?: string | undefined;

    user?: User | undefined;
    language?: string | undefined;
  }

  interface FileBase {
    file_id: string;
    file_size?: number | undefined;
  }

  interface PhotoSize extends FileBase {
    width: number;
    height: number;
  }

  interface Audio extends FileBase {
    duration: number;
    performer?: string | undefined;
    title?: string | undefined;
    mime_type?: string | undefined;
    thumb?: PhotoSize | undefined;
  }

  interface Document extends FileBase {
    thumb?: PhotoSize | undefined;
    file_name?: string | undefined;
    mime_type?: string | undefined;
  }

  interface Video extends FileBase {
    width: number;
    height: number;
    duration: number;
    thumb?: PhotoSize | undefined;
    mime_type?: string | undefined;
  }

  interface Voice extends FileBase {
    duration: number;
    mime_type?: string | undefined;
  }

  interface InputMediaBase {
    media: string;
    caption?: string | undefined;
    parse_mode?: ParseMode | undefined;
  }

  interface InputMediaPhoto extends InputMediaBase {
    type: 'photo';
    fileOptions?: any;
  }

  interface InputMediaVideo extends InputMediaBase {
    type: 'video';
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    supports_streaming?: boolean | undefined;
    fileOptions?: any;
  }

  type InputMedia = InputMediaPhoto | InputMediaVideo;

  interface VideoNote extends FileBase {
    length: number;
    duration: number;
    thumb?: PhotoSize | undefined;
  }

  interface Contact {
    phone_number: string;
    first_name: string;
    last_name?: string | undefined;
    user_id?: number | undefined;
    vcard?: string | undefined;
  }

  interface Location {
    longitude: number;
    latitude: number;
  }

  interface Venue {
    location: Location;
    title: string;
    address: string;
    foursquare_id?: string | undefined;
    foursquare_type?: string | undefined;
  }

  type PollType = 'regular' | 'quiz';

  interface PollAnswer {
    poll_id: string;
    user: User;
    option_ids: number[];
  }

  interface PollOption {
    text: string;
    voter_count: number;
  }

  interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    is_closed: boolean;
    is_anonymous: boolean;
    allows_multiple_answers: boolean;
    type: PollType;
    total_voter_count: number;
  }

  interface Dice {
    emoji: string;
    value: number;
  }

  interface ChatJoinRequest {
    chat: Chat;
    from: User;
    date: number;
    bio?: string | undefined;
    invite_link?: ChatInviteLink | undefined;
  }

  interface UserProfilePhotos {
    total_count: number;
    photos: PhotoSize[][];
  }

  interface File extends FileBase {
    file_path?: string | undefined;
  }

  interface ReplyKeyboardMarkup {
    keyboard: KeyboardButton[][];
    resize_keyboard?: boolean | undefined;
    one_time_keyboard?: boolean | undefined;
    selective?: boolean | undefined;
  }

  interface KeyboardButton {
    text: string;
    request_contact?: boolean | undefined;
    request_location?: boolean | undefined;
    request_poll?: KeyboardButtonPollType;
    web_app?: WebAppInfo;
  }

  interface KeyboardButtonPollType {
    type: PollType;
  }

  interface ReplyKeyboardRemove {
    remove_keyboard: boolean;
    selective?: boolean | undefined;
  }

  interface InlineKeyboardMarkup {
    inline_keyboard: InlineKeyboardButton[][];
  }

  interface InlineKeyboardButton {
    text: string;
    url?: string | undefined;
    callback_data?: string | undefined;
    web_app?: WebAppInfo;
    login_url?: LoginUrl | undefined;
    switch_inline_query?: string | undefined;
    switch_inline_query_current_chat?: string | undefined;
    callback_game?: CallbackGame | undefined;
    pay?: boolean | undefined;
  }

  interface LoginUrl {
    url: string;
    forward_text?: string | undefined;
    bot_username?: string | undefined;
    request_write_access?: boolean | undefined;
  }

  interface CallbackQuery {
    id: string;
    from: User;
    message?: Message | undefined;
    inline_message_id?: string | undefined;
    chat_instance: string;
    data?: string | undefined;
    game_short_name?: string | undefined;
  }

  interface ForceReply {
    force_reply: boolean;
    selective?: boolean | undefined;
  }

  interface ChatPhoto {
    small_file_id: string;
    big_file_id: string;
  }

  interface ChatInviteLink {
    invite_link: string;
    creator: User;
    is_primary: boolean;
    is_revoked: boolean;
    expire_date?: number;
    member_limit?: number;
    name?: string;
  }

  interface ChatMember {
    user: User;
    status: ChatMemberStatus;
    until_date?: number | undefined;
    can_be_edited?: boolean | undefined;
    can_post_messages?: boolean | undefined;
    can_edit_messages?: boolean | undefined;
    can_delete_messages?: boolean | undefined;
    can_restrict_members?: boolean | undefined;
    can_promote_members?: boolean | undefined;
    can_change_info?: boolean | undefined;
    can_invite_users?: boolean | undefined;
    can_pin_messages?: boolean | undefined;
    is_member?: boolean | undefined;
    can_send_messages?: boolean | undefined;
    can_send_media_messages?: boolean | undefined;
    can_send_polls?: boolean | undefined;
    can_send_other_messages?: boolean | undefined;
    can_add_web_page_previews?: boolean | undefined;
  }

  interface ChatMemberUpdated {
    chat: Chat;
    from: User;
    date: number;
    old_chat_member: ChatMember;
    new_chat_member: ChatMember;
    invite_link?: ChatInviteLink;
  }

  interface ChatPermissions {
    can_send_messages?: boolean | undefined;
    can_send_media_messages?: boolean | undefined;
    can_send_polls?: boolean | undefined;
    can_send_other_messages?: boolean | undefined;
    can_add_web_page_previews?: boolean | undefined;
    can_change_info?: boolean | undefined;
    can_invite_users?: boolean | undefined;
    can_pin_messages?: boolean | undefined;
  }

  interface Sticker {
    file_id: string;
    file_unique_id: string;
    is_animated: boolean;
    width: number;
    height: number;
    thumb?: PhotoSize | undefined;
    emoji?: string | undefined;
    set_name?: string | undefined;
    mask_position?: MaskPosition | undefined;
    file_size?: number | undefined;
  }

  interface StickerSet {
    name: string;
    title: string;
    contains_masks: boolean;
    stickers: Sticker[];
  }

  interface MaskPosition {
    point: string;
    x_shift: number;
    y_shift: number;
    scale: number;
  }

  interface InlineQuery {
    id: string;
    from: User;
    location?: Location | undefined;
    query: string;
    offset: string;
  }

  interface InlineQueryResultBase {
    id: string;
    reply_markup?: InlineKeyboardMarkup | undefined;
  }

  interface InlineQueryResultArticle extends InlineQueryResultBase {
    type: 'article';
    title: string;
    input_message_content: InputMessageContent;
    url?: string | undefined;
    hide_url?: boolean | undefined;
    description?: string | undefined;
    thumb_url?: string | undefined;
    thumb_width?: number | undefined;
    thumb_height?: number | undefined;
  }

  interface InlineQueryResultPhoto extends InlineQueryResultBase {
    type: 'photo';
    photo_url: string;
    thumb_url: string;
    photo_width?: number | undefined;
    photo_height?: number | undefined;
    title?: string | undefined;
    description?: string | undefined;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultGif extends InlineQueryResultBase {
    type: 'gif';
    gif_url: string;
    gif_width?: number | undefined;
    gif_height?: number | undefined;
    gif_duration?: number | undefined;
    thumb_url?: string | undefined;
    title?: string | undefined;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultMpeg4Gif extends InlineQueryResultBase {
    type: 'mpeg4_gif';
    mpeg4_url: string;
    mpeg4_width?: number | undefined;
    mpeg4_height?: number | undefined;
    mpeg4_duration?: number | undefined;
    thumb_url?: string | undefined;
    title?: string | undefined;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultVideo extends InlineQueryResultBase {
    type: 'video';
    video_url: string;
    mime_type: string;
    thumb_url: string;
    title: string;
    caption?: string | undefined;
    video_width?: number | undefined;
    video_height?: number | undefined;
    video_duration?: number | undefined;
    description?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultAudio extends InlineQueryResultBase {
    type: 'audio';
    audio_url: string;
    title: string;
    caption?: string | undefined;
    performer?: string | undefined;
    audio_duration?: number | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultVoice extends InlineQueryResultBase {
    type: 'voice';
    voice_url: string;
    title: string;
    caption?: string | undefined;
    voice_duration?: number | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultDocument extends InlineQueryResultBase {
    type: 'document';
    title: string;
    caption?: string | undefined;
    document_url: string;
    mime_type: string;
    description?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
    thumb_url?: string | undefined;
    thumb_width?: number | undefined;
    thumb_height?: number | undefined;
  }

  interface InlineQueryResultLocationBase extends InlineQueryResultBase {
    latitude: number;
    longitude: number;
    title: string;
    input_message_content?: InputMessageContent | undefined;
    thumb_url?: string | undefined;
    thumb_width?: number | undefined;
    thumb_height?: number | undefined;
  }

  interface InlineQueryResultLocation extends InlineQueryResultLocationBase {
    type: 'location';
  }

  interface InlineQueryResultVenue extends InlineQueryResultLocationBase {
    type: 'venue';
    address: string;
    foursquare_id?: string | undefined;
  }

  interface InlineQueryResultContact extends InlineQueryResultBase {
    type: 'contact';
    phone_number: string;
    first_name: string;
    last_name?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
    thumb_url?: string | undefined;
    thumb_width?: number | undefined;
    thumb_height?: number | undefined;
  }

  interface InlineQueryResultGame extends InlineQueryResultBase {
    type: 'game';
    game_short_name: string;
  }

  interface InlineQueryResultCachedPhoto extends InlineQueryResultBase {
    type: 'photo';
    photo_file_id: string;
    title?: string | undefined;
    description?: string | undefined;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultCachedGif extends InlineQueryResultBase {
    type: 'gif';
    gif_file_id: string;
    title?: string | undefined;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultCachedMpeg4Gif extends InlineQueryResultBase {
    type: 'mpeg4_gif';
    mpeg4_file_id: string;
    title?: string | undefined;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultCachedSticker extends InlineQueryResultBase {
    type: 'sticker';
    sticker_file_id: string;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultCachedDocument extends InlineQueryResultBase {
    type: 'document';
    title: string;
    document_file_id: string;
    description?: string | undefined;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultCachedVideo extends InlineQueryResultBase {
    type: 'video';
    video_file_id: string;
    title: string;
    description?: string | undefined;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultCachedVoice extends InlineQueryResultBase {
    type: 'voice';
    voice_file_id: string;
    title: string;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  interface InlineQueryResultCachedAudio extends InlineQueryResultBase {
    type: 'audio';
    audio_file_id: string;
    caption?: string | undefined;
    input_message_content?: InputMessageContent | undefined;
  }

  type InlineQueryResult =
    | InlineQueryResultCachedAudio
    | InlineQueryResultCachedDocument
    | InlineQueryResultCachedGif
    | InlineQueryResultCachedMpeg4Gif
    | InlineQueryResultCachedPhoto
    | InlineQueryResultCachedSticker
    | InlineQueryResultCachedVideo
    | InlineQueryResultCachedVoice
    | InlineQueryResultArticle
    | InlineQueryResultAudio
    | InlineQueryResultContact
    | InlineQueryResultGame
    | InlineQueryResultDocument
    | InlineQueryResultGif
    | InlineQueryResultLocation
    | InlineQueryResultMpeg4Gif
    | InlineQueryResultPhoto
    | InlineQueryResultVenue
    | InlineQueryResultVideo
    | InlineQueryResultVoice;

  type InputMessageContent = object;

  interface InputTextMessageContent extends InputMessageContent {
    message_text: string;
    parse_mode?: ParseMode | undefined;
    disable_web_page_preview?: boolean | undefined;
  }

  interface InputLocationMessageContent extends InputMessageContent {
    latitude: number;
    longitude: number;
  }

  interface InputVenueMessageContent extends InputLocationMessageContent {
    title: string;
    address: string;
    foursquare_id?: string | undefined;
  }

  interface InputContactMessageContent extends InputMessageContent {
    phone_number: string;
    first_name: string;
    last_name?: string | undefined;
  }

  interface ChosenInlineResult {
    result_id: string;
    from: User;
    location?: Location | undefined;
    inline_message_id?: string | undefined;
    query: string;
  }

  interface ResponseParameters {
    migrate_to_chat_id?: number | undefined;
    retry_after?: number | undefined;
  }

  interface LabeledPrice {
    label: string;
    amount: number;
  }

  interface Invoice {
    title: string;
    description: string;
    start_parameter: string;
    currency: string;
    total_amount: number;
  }

  interface ShippingAddress {
    country_code: string;
    state: string;
    city: string;
    street_line1: string;
    street_line2: string;
    post_code: string;
  }

  interface OrderInfo {
    name?: string | undefined;
    phone_number?: string | undefined;
    email?: string | undefined;
    shipping_address?: ShippingAddress | undefined;
  }

  interface ShippingOption {
    id: string;
    title: string;
    prices: LabeledPrice[];
  }

  interface SuccessfulPayment {
    currency: string;
    total_amount: number;
    invoice_payload: string;
    shipping_option_id?: string | undefined;
    order_info?: OrderInfo | undefined;
    telegram_payment_charge_id: string;
    provider_payment_charge_id: string;
  }

  interface ShippingQuery {
    id: string;
    from: User;
    invoice_payload: string;
    shipping_address: ShippingAddress;
  }

  interface PreCheckoutQuery {
    id: string;
    from: User;
    currency: string;
    total_amount: number;
    invoice_payload: string;
    shipping_option_id?: string | undefined;
    order_info?: OrderInfo | undefined;
  }

  interface Game {
    title: string;
    description: string;
    photo: PhotoSize[];
    text?: string | undefined;
    text_entities?: MessageEntity[] | undefined;
    animation?: Animation | undefined;
  }

  interface Animation extends FileBase {
    width: number;
    height: number;
    duration: number;
    thumb?: PhotoSize | undefined;
    file_name?: string | undefined;
    mime_type?: string | undefined;
  }

  type CallbackGame = object;

  interface GameHighScore {
    position: number;
    user: User;
    score: number;
  }

  interface Metadata {
    type?: MessageType | undefined;
  }

  interface BotCommand {
    command: string;
    description: string;
  }

  interface MessageId {
    message_id: number;
  }

  type ChatId = number | string;

  interface BotCommandScopeDefault {
    type: 'default';
  }

  interface BotCommandScopeAllPrivateChats {
    type: 'all_private_chats';
  }

  interface BotCommandScopeAllGroupChats {
    type: 'all_group_chats';
  }

  interface BotCommandScopeAllChatAdministrators {
    type: 'all_chat_administrators';
  }

  interface BotCommandScopeChat {
    type: 'chat';
    chat_id: ChatId;
  }

  interface BotCommandScopeChatAdministrators {
    type: 'chat_administrators';
    chat_id: ChatId;
  }

  interface BotCommandScopeChatMember {
    type: 'chat_member';
    chat_id: ChatId;
    user_id: number;
  }

  type BotCommandScope =
    | BotCommandScopeDefault
    | BotCommandScopeAllPrivateChats
    | BotCommandScopeAllGroupChats
    | BotCommandScopeAllChatAdministrators
    | BotCommandScopeChat
    | BotCommandScopeChatAdministrators
    | BotCommandScopeChatMember;
  interface WebAppInfo {
    url: string;
  }

  interface WebAppData {
    data: string;
    button_text: string;
  }

  interface MenuButtonCommands {
    type: 'commands';
  }
  interface MenuButtonWebApp {
    type: 'web_app';
    text: string;
    web_app: WebAppInfo;
  }
  interface MenuButtonDefault {
    type: 'default';
  }

  type MenuButton = MenuButtonCommands | MenuButtonWebApp | MenuButtonDefault;

  interface ChatAdministratorRights {
    is_anonymous: boolean;
    can_manage_chat: boolean;
    can_delete_messages: boolean;
    can_manage_video_chats: boolean;
    can_restrict_members: boolean;
    can_promote_members: boolean;
    can_change_info: boolean;
    can_invite_users: boolean;
    can_post_messages?: boolean;
    can_edit_messages?: boolean;
    can_pin_messages?: boolean;
  }

  interface SentWebAppMessage {
    inline_message_id?: string;
  }
}

const _messageTypes = [
  'text',
  'animation',
  'audio',
  'channel_chat_created',
  'contact',
  'delete_chat_photo',
  'dice',
  'document',
  'game',
  'group_chat_created',
  'invoice',
  'left_chat_member',
  'location',
  'migrate_from_chat_id',
  'migrate_to_chat_id',
  'new_chat_members',
  'new_chat_photo',
  'new_chat_title',
  'passport_data',
  'photo',
  'pinned_message',
  'poll',
  'sticker',
  'successful_payment',
  'supergroup_chat_created',
  'video',
  'video_note',
  'voice',
  'video_chat_started',
  'video_chat_ended',
  'video_chat_participants_invited',
  'video_chat_scheduled',
  'message_auto_delete_timer_changed',
  'chat_invite_link',
  'chat_member_updated',
  'web_app_data',
];

/**
 * JSON-serialize data. If the provided data is already a String,
 * return it as is.
 * @private
 * @param  {*} data
 * @return {String}
 */
const stringify = (data: any) => {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
};

export class TelegramBot {
  private _textRegexpCallbacks: any[];

  constructor(
    private token: string,
    private options: TelegramBot.ConstructorOptions = {},
  ) {
    this.options.httpsAgent =
      typeof options.httpsAgent === 'undefined'
        ? new SocksProxyAgent('socks://127.0.0.1:1080')
        : options.httpsAgent;
    this.options.baseApiUrl = options.baseApiUrl || 'https://api.telegram.org';
    this.options.filepath =
      typeof options.filepath === 'undefined' ? true : options.filepath;
    this._textRegexpCallbacks = [];
  }

  /**
   * The types of message updates the library handles.
   * @type {String[]}
   */
  static get messageTypes() {
    return _messageTypes;
  }

  /**
   * Generates url with bot token and provided path/method you want to be got/executed by bot
   * @param  {String} path
   * @return {String} url
   * @private
   * @see https://core.telegram.org/bots/api#making-requests
   */
  _buildURL(_path) {
    return `${this.options.baseApiUrl}/bot${this.token}/${_path}`;
  }

  _request(_path: string, options: any = {}) {
    if (!this.token) {
      return Promise.reject(new Error('Telegram Bot Token not provided!'));
    }

    if (!this.options.httpsAgent) {
      return Promise.reject(
        new Error('Telegram Bot SocksProxyAgent not provided!'),
      );
    }
    console.log(this._buildURL(_path));
    console.log(options.form);
    debug('HTTP request: %j', options.form);
    const httpsAgent: SocksProxyAgent = this.options.httpsAgent;
    return axios
      .post(this._buildURL(_path), options.form, { httpsAgent })
      .then((resp) => {
        let data = resp.data;
        if (data.ok) {
          return data.result;
        }
        throw new errors.TelegramError(
          `${data.error_code} ${data.description}`,
          resp,
        );
      })
      .catch((error) => {
        // TODO: why can't we do `error instanceof errors.BaseError`?
        if (error.response) throw error;
        throw new Error(error);
      });
  }

  /**
   * Format data to be uploaded; handles file paths, streams and buffers
   * @param  {String} type
   * @param  {String|stream.Stream|Buffer} data
   * @param  {Object} fileOptions File options
   * @param  {String} [fileOptions.filename] File name
   * @param  {String} [fileOptions.contentType] Content type (i.e. MIME)
   * @return {Array} formatted
   * @return {Object} formatted[0] formData
   * @return {String} formatted[1] fileId
   * @throws Error if Buffer file type is not supported.
   * @see https://npmjs.com/package/file-type
   * @private
   */
  _formatSendData(type: any, data?: any, fileOptions: any = {}) {
    const deprecationMessage =
      'See https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files' +
      ' for more information on how sending files has been improved and' +
      ' on how to disable this deprecation message altogether.';
    let filedata = data;
    let filename = fileOptions.filename;
    let contentType = fileOptions.contentType;

    if (data instanceof stream.Stream) {
      let _data: any = data;
      if (!filename && _data.path) {
        // Will be 'null' if could not be parsed.
        // For example, 'data.path' === '/?id=123' from 'request("https://example.com/?id=123")'
        const url = URL.parse(path.basename(_data.path.toString()));
        if (url.pathname) {
          filename = qs.unescape(url.pathname);
        }
      }
    } else if (Buffer.isBuffer(data)) {
      if (!filename && !process.env.NTBA_FIX_350) {
        deprecate(
          `Buffers will have their filenames default to "filename" instead of "data". ${deprecationMessage}`,
        );
        filename = 'data';
      }
      if (!contentType) {
        const filetype: any = fileType(data);
        if (filetype) {
          contentType = filetype.mime;
          const ext = filetype.ext;
          if (ext && !process.env.NTBA_FIX_350) {
            filename = `${filename}.${ext}`;
          }
        } else if (!process.env.NTBA_FIX_350) {
          deprecate(
            `An error will no longer be thrown if file-type of buffer could not be detected. ${deprecationMessage}`,
          );
          throw new errors.FatalError('Unsupported Buffer file-type');
        }
      }
    } else if (data) {
      if (this.options.filepath && fs.existsSync(data)) {
        filedata = fs.createReadStream(data);
        if (!filename) {
          filename = path.basename(data);
        }
      } else {
        return [null, data];
      }
    } else {
      return [null, data];
    }

    filename = filename || 'filename';
    contentType = contentType || mime.lookup(filename);
    if (process.env.NTBA_FIX_350) {
      contentType = contentType || 'application/octet-stream';
    } else {
      deprecate(
        `In the future, content-type of files you send will default to "application/octet-stream". ${deprecationMessage}`,
      );
    }

    // TODO: Add missing file extension.

    return [
      {
        [type]: {
          value: filedata,
          options: {
            filename,
            contentType,
          },
        },
      },
      null,
    ];
  }

  /**
   * Returns basic information about the bot in form of a `User` object.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getme
   */
  getMe(form: any = {}): Promise<TelegramBot.User> {
    return this._request('getMe', { form });
  }

  /**
   * This method log out your bot from the cloud Bot API server before launching the bot locally.
   * You must log out the bot before running it locally, otherwise there is no guarantee that the bot will receive updates.
   * After a successful call, you will not be able to log in again using the same token for 10 minutes.
   * Returns True on success.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#logout
   */
  logOut(form = {}): Promise<boolean> {
    return this._request('logOut', { form });
  }

  /**
   * This method close the bot instance before moving it from one local server to another.
   * This method will return error 429 in the first 10 minutes after the bot is launched.
   * Returns True on success.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#close
   */
  close(form = {}): Promise<boolean> {
    return this._request('close', { form });
  }

  /**
   * Use this method to get current webhook status.
   * On success, returns a [WebhookInfo](https://core.telegram.org/bots/api#webhookinfo) object.
   * If the bot is using getUpdates, will return an object with the
   * url field empty.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getwebhookinfo
   */
  getWebHookInfo(form = {}): Promise<TelegramBot.WebhookInfo> {
    return this._request('getWebhookInfo', { form });
  }
  getUpdates(
    form?: TelegramBot.GetUpdatesOptions,
  ): Promise<TelegramBot.Update[]> {
    /* The older method signature was getUpdates(timeout, limit, offset).
     * We need to ensure backwards-compatibility while maintaining
     * consistency of the method signatures throughout the library */
    if (typeof form !== 'object') {
      /* eslint-disable no-param-reassign, prefer-rest-params */
      deprecate(
        'The method signature getUpdates(timeout, limit, offset) has been deprecated since v0.25.0',
      );
      form = {
        timeout: arguments[0],
        limit: arguments[1],
        offset: arguments[2],
      };
      /* eslint-enable no-param-reassign, prefer-rest-params */
    }

    return this._request('getUpdates', { form });
  }

  /**
   * Send text message.
   * @param  {Number|String} chatId Unique identifier for the message recipient
   * @param  {String} text Text of the message to be sent
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  sendMessage(
    chatId: TelegramBot.ChatId,
    text: string,
    form: TelegramBot.SendMessageOptions = {},
  ): Promise<TelegramBot.Message> {
    form.chat_id = chatId;
    form.text = text;
    return this._request('sendMessage', { form });
  }

  /**
   * Send answers to an inline query.
   * @param  {String} inlineQueryId Unique identifier of the query
   * @param  {InlineQueryResult[]} results An array of results for the inline query
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#answerinlinequery
   */
  answerInlineQuery(
    inlineQueryId: string,
    results: ReadonlyArray<TelegramBot.InlineQueryResult>,
    form?: TelegramBot.AnswerInlineQueryOptions,
  ): Promise<boolean> {
    form.inline_query_id = inlineQueryId;
    form.results = stringify(results);
    return this._request('answerInlineQuery', { form });
  }

  /**
   * Forward messages of any kind.
   * @param  {Number|String} chatId     Unique identifier for the message recipient
   * @param  {Number|String} fromChatId Unique identifier for the chat where the
   * original message was sent
   * @param  {Number|String} messageId  Unique message identifier
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#forwardmessage
   */
  forwardMessage(
    chatId: TelegramBot.ChatId,
    fromChatId: TelegramBot.ChatId,
    messageId: number | string,
    form?: TelegramBot.ForwardMessageOptions,
  ): Promise<TelegramBot.Message> {
    form.chat_id = chatId;
    form.from_chat_id = fromChatId;
    form.message_id = messageId;
    return this._request('forwardMessage', { form });
  }

  /**
   * Copy messages of any kind.
   * The method is analogous to the method forwardMessages, but the copied message doesn't
   * have a link to the original message.
   * Returns the MessageId of the sent message on success.
   * @param  {Number|String} chatId     Unique identifier for the message recipient
   * @param  {Number|String} fromChatId Unique identifier for the chat where the
   * original message was sent
   * @param  {Number|String} messageId  Unique message identifier
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#copymessage
   */
  copyMessage(
    chatId: TelegramBot.ChatId,
    fromChatId: TelegramBot.ChatId,
    messageId: number | string,
    form?: TelegramBot.CopyMessageOptions,
  ): Promise<TelegramBot.MessageId> {
    form.chat_id = chatId;
    form.from_chat_id = fromChatId;
    form.message_id = messageId;
    return this._request('copyMessage', { form });
  }

  /**
   * Send photo
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String|stream.Stream|Buffer} photo A file path or a Stream. Can
   * also be a `file_id` previously uploaded
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendphoto
   * @see https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
   */
  sendPhoto(
    chatId: TelegramBot.ChatId,
    photo: string | stream | Buffer,
    options?: TelegramBot.SendPhotoOptions,
    fileOptions?: TelegramBot.FileOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData('photo', photo, fileOptions);
      opts.formData = sendData[0];
      opts.qs.photo = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('sendPhoto', opts);
  }

  /**
   * Send audio
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String|stream.Stream|Buffer} audio A file path, Stream or Buffer.
   * Can also be a `file_id` previously uploaded.
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendaudio
   * @see https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
   */
  sendAudio(
    chatId: TelegramBot.ChatId,
    audio: string | stream | Buffer,
    options?: TelegramBot.SendAudioOptions,
    fileOptions?: TelegramBot.FileOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };

    opts.qs.chat_id = chatId;

    try {
      const sendData = this._formatSendData('audio', audio, fileOptions);
      opts.formData = sendData[0];
      opts.qs.audio = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }

    if (options.thumb) {
      if (opts.formData === null) {
        opts.formData = {};
      }

      try {
        const attachName = 'photo';
        const [formData] = this._formatSendData(
          attachName,
          options.thumb.replace('attach://', ''),
        );

        if (formData) {
          opts.formData[attachName] = formData[attachName];
          opts.qs.thumb = `attach://${attachName}`;
        }
      } catch (ex) {
        return Promise.reject(ex);
      }
    }

    return this._request('sendAudio', opts);
  }

  /**
   * Use this method to send animation files (GIF or H.264/MPEG-4 AVC video without sound).
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String|stream.Stream|Buffer} animation A file path, Stream or Buffer.
   * Can also be a `file_id` previously uploaded.
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendanimation
   * @see https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
   */
  sendAnimation(
    chatId: TelegramBot.ChatId,
    animation: string | stream | Buffer,
    options?: TelegramBot.SendAnimationOptions,
    fileOptions: any = {},
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData(
        'animation',
        animation,
        fileOptions,
      );
      opts.formData = sendData[0];
      opts.qs.animation = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('sendAnimation', opts);
  }

  /**
   * Send Dice
   * Use this method to send a dice.
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#senddice
   */
  sendDice(
    chatId: TelegramBot.ChatId,
    options?: TelegramBot.SendDiceOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData('dice');
      opts.formData = sendData[0];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('sendDice', opts);
  }

  /**
   * Send Document
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String|stream.Stream|Buffer} doc A file path, Stream or Buffer.
   * Can also be a `file_id` previously uploaded.
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendDocument
   * @see https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
   */
  sendDocument(
    chatId: TelegramBot.ChatId,
    doc: string | stream | Buffer,
    options?: TelegramBot.SendDocumentOptions,
    fileOptions?: TelegramBot.FileOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData('document', doc, fileOptions);
      opts.formData = sendData[0];
      opts.qs.document = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('sendDocument', opts);
  }

  /**
   * Use this method to send a group of photos or videos as an album.
   * On success, an array of the sent [Messages](https://core.telegram.org/bots/api#message)
   * is returned.
   *
   * If you wish to [specify file options](https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files),
   * add a `fileOptions` property to the target input in `media`.
   *
   * @param  {String} chatId Unique identifier for the target chat or username of the target channel (in the format `@channelusername`)
   * @param  {Array} media A JSON-serialized array describing photos and videos to be sent, must include 2–10 items
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendmediagroup
   * @see https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
   */
  sendMediaGroup(
    chatId: TelegramBot.ChatId,
    media: ReadonlyArray<TelegramBot.InputMedia>,
    options?: TelegramBot.SendMediaGroupOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;

    opts.formData = {};
    const inputMedia = [];
    let index = 0;
    for (const input of media) {
      const _input: any = input;
      const payload: any = Object.assign({}, input);
      delete payload.media;
      delete payload.fileOptions;
      try {
        const attachName = String(index);
        const [formData, fileId] = this._formatSendData(
          attachName,
          _input.media,
          _input.fileOptions,
        );
        if (formData) {
          opts.formData[attachName] = formData[attachName];
          payload.media = `attach://${attachName}`;
        } else {
          payload.media = fileId;
        }
      } catch (ex) {
        return Promise.reject(ex);
      }
      inputMedia.push(payload);
      index++;
    }
    opts.qs.media = JSON.stringify(inputMedia);

    return this._request('sendMediaGroup', opts);
  }

  /**
   * Send poll.
   * Use this method to send a native poll.
   *
   * @param  {Number|String} chatId  Unique identifier for the group/channel
   * @param  {String} question Poll question, 255 char limit
   * @param  {Array} pollOptions Poll options, between 2-10 options
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendpoll
   */
  sendPoll(
    chatId: TelegramBot.ChatId,
    question: string,
    pollOptions: ReadonlyArray<string>,
    form?: TelegramBot.SendPollOptions,
  ): Promise<TelegramBot.Message> {
    form.chat_id = chatId;
    form.question = question;
    form.options = stringify(pollOptions);
    return this._request('sendPoll', { form });
  }

  /**
   * Stop poll.
   * Use this method to stop a native poll.
   *
   * @param  {Number|String} chatId  Unique identifier for the group/channel
   * @param  {Number} pollId Identifier of the original message with the poll
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#stoppoll
   */
  stopPoll(
    chatId: TelegramBot.ChatId,
    messageId: number,
    form?: TelegramBot.StopPollOptions,
  ): Promise<TelegramBot.Poll> {
    form.chat_id = chatId;
    form.message_id = messageId;
    return this._request('stopPoll', { form });
  }

  /**
   * Send .webp stickers.
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String|stream.Stream|Buffer} sticker A file path, Stream or Buffer.
   * Can also be a `file_id` previously uploaded. Stickers are WebP format files.
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendsticker
   */
  sendSticker(
    chatId: TelegramBot.ChatId,
    sticker: string | stream | Buffer,
    options?: TelegramBot.SendStickerOptions,
    fileOptions?: TelegramBot.FileOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData('sticker', sticker, fileOptions);
      opts.formData = sendData[0];
      opts.qs.sticker = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('sendSticker', opts);
  }
  /**
   * Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document).
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String|stream.Stream|Buffer} video A file path or Stream.
   * Can also be a `file_id` previously uploaded.
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendvideo
   * @see https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
   */
  sendVideo(
    chatId: TelegramBot.ChatId,
    video: string | stream | Buffer,
    options?: TelegramBot.SendVideoOptions,
    fileOptions?: TelegramBot.FileOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData('video', video, fileOptions);
      opts.formData = sendData[0];
      opts.qs.video = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('sendVideo', opts);
  }

  /**
   * Use this method to send rounded square videos of upto 1 minute long.
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String|stream.Stream|Buffer} videoNote A file path or Stream.
   * Can also be a `file_id` previously uploaded.
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @info The length parameter is actually optional. However, the API (at time of writing) requires you to always provide it until it is fixed.
   * @see https://core.telegram.org/bots/api#sendvideonote
   * @see https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
   */
  sendVideoNote(
    chatId: TelegramBot.ChatId,
    videoNote: string | stream | Buffer,
    options?: TelegramBot.SendVideoNoteOptions,
    fileOptions?: TelegramBot.FileOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData(
        'video_note',
        videoNote,
        fileOptions,
      );
      opts.formData = sendData[0];
      opts.qs.video_note = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('sendVideoNote', opts);
  }

  /**
   * Send voice
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String|stream.Stream|Buffer} voice A file path, Stream or Buffer.
   * Can also be a `file_id` previously uploaded.
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendvoice
   * @see https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
   */
  sendVoice(
    chatId: TelegramBot.ChatId,
    voice: string | stream | Buffer,
    options?: TelegramBot.SendVoiceOptions,
    fileOptions?: TelegramBot.FileOptions,
  ): Promise<TelegramBot.Message> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData('voice', voice, fileOptions);
      opts.formData = sendData[0];
      opts.qs.voice = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('sendVoice', opts);
  }

  /**
   * Send chat action.
   * `typing` for text messages,
   * `upload_photo` for photos, `record_video` or `upload_video` for videos,
   * `record_voice` or `upload_voice` for audio files, `upload_document` for general files,
   * `choose_sticker` for stickers, `find_location` for location data,
   * `record_video_note` or `upload_video_note` for video notes.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String} action Type of action to broadcast.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendchataction
   */
  sendChatAction(
    chatId: TelegramBot.ChatId,
    action: TelegramBot.ChatAction,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.action = action;
    return this._request('sendChatAction', { form });
  }

  /**
   * Use this method to kick a user from a group or a supergroup.
   * In the case of supergroups, the user will not be able to return
   * to the group on their own using invite links, etc., unless unbanned
   * first. The bot must be an administrator in the group for this to work.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the target group or username of the target supergroup
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#kickchatmember
   * @deprecated Deprecated since Telegram Bot API v5.3, replace with "banChatMember"
   */
  kickChatMember(
    chatId: TelegramBot.ChatId,
    userId: string,
    form: any = {},
  ): Promise<boolean> {
    deprecate(
      'The method kickChatMembet is deprecated since Telegram Bot API v5.3, replace it with "banChatMember"',
    );
    form.chat_id = chatId;
    form.user_id = userId;
    return this._request('kickChatMember', { form });
  }

  /**
   * Use this method to ban a user in a group, a supergroup or a channel.
   * In the case of supergroups and channels, the user will not be able to
   * return to the chat on their own using invite links, etc., unless unbanned first..
   * The bot must be an administrator in the group for this to work.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the target group or username of the target supergroup
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#banchatmember
   */
  banChatMember(
    chatId: number | string,
    userId: string,
    untilDate?: number,
    revokeMessages?: boolean,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.user_id = userId;
    form.untilDate = untilDate;
    form.revokeMessages = revokeMessages;
    return this._request('banChatMember', { form });
  }

  /**
   * Use this method to unban a previously kicked user in a supergroup.
   * The user will not return to the group automatically, but will be
   * able to join via link, etc. The bot must be an administrator in
   * the group for this to work. Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the target group or username of the target supergroup
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#unbanchatmember
   */
  unbanChatMember(
    chatId: TelegramBot.ChatId,
    userId: string,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.user_id = userId;
    return this._request('unbanChatMember', { form });
  }

  /**
   * Use this method to ban a channel chat in a supergroup or a channel.
   * The owner of the chat will not be able to send messages and join live streams
   * on behalf of the chat, unless it is unbanned first.
   * The bot must be an administrator in the supergroup or channel for this to work
   * and must have the appropriate administrator rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the target group or username of the target supergroup
   * @param  {Number} senderChatId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Boolean}
   * @see https://core.telegram.org/bots/api#banchatsenderchat
   */
  banChatSenderChat(
    chatId: TelegramBot.ChatId,
    senderChatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.sender_chat_id = senderChatId;
    return this._request('banChatSenderChat', { form });
  }

  /**
   * Use this method to unban a previously banned channel chat in a supergroup or channel.
   * The bot must be an administrator for this to work and must have the appropriate administrator rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the target group or username of the target supergroup
   * @param  {Number} senderChatId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Boolean}
   * @see https://core.telegram.org/bots/api#unbanchatsenderchat
   */
  unbanChatSenderChat(
    chatId: TelegramBot.ChatId,
    senderChatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.sender_chat_id = senderChatId;
    return this._request('unbanChatSenderChat', { form });
  }
  /**
   * Use this method to restrict a user in a supergroup.
   * The bot must be an administrator in the supergroup for this to work
   * and must have the appropriate admin rights. Pass True for all boolean parameters
   * to lift restrictions from a user. Returns True on success.
   *
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup
   * @param  {Number} userId Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#restrictchatmember
   */
  restrictChatMember(
    chatId: TelegramBot.ChatId,
    userId: string,
    form?: TelegramBot.RestrictChatMemberOptions,
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.user_id = userId;
    return this._request('restrictChatMember', { form });
  }

  /**
   * Use this method to promote or demote a user in a supergroup or a channel.
   * The bot must be an administrator in the chat for this to work
   * and must have the appropriate admin rights. Pass False for all boolean parameters to demote a user.
   * Returns True on success.
   *
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup
   * @param  {Number} userId
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#promotechatmember
   */
  promoteChatMember(
    chatId: TelegramBot.ChatId,
    userId: string,
    form?: TelegramBot.PromoteChatMemberOptions,
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.user_id = userId;
    return this._request('promoteChatMember', { form });
  }

  /**
   * Use this method to export an invite link to a supergroup or a channel.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns exported invite link as String on success.
   *
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#exportchatinvitelink
   */
  exportChatInviteLink(
    chatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<string> {
    form.chat_id = chatId;
    return this._request('exportChatInviteLink', { form });
  }

  /**
   * Use this method to create an additional invite link for a chat.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns the new invite link as ChatInviteLink object.
   *
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup
   * @param  {Object} [options] Additional Telegram query options
   * @return {Object} ChatInviteLink
   * @see https://core.telegram.org/bots/api#createchatinvitelink
   */
  createChatInviteLink(
    chatId: TelegramBot.ChatId,
    name?: string,
    expire_date?: number,
    member_limit?: number,
    creates_join_request?: boolean,
    form: any = {},
  ): Promise<TelegramBot.ChatInviteLink> {
    form.chat_id = chatId;
    form.name = name;
    form.expire_date = expire_date;
    form.member_limit = member_limit;
    form.creates_join_request = creates_join_request;
    return this._request('createChatInviteLink', { form });
  }

  /**
   * Use this method to edit a non-primary invite link created by the bot.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns the edited invite link as a ChatInviteLink object.
   *
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup
   * @param  {String} inviteLink Text with the invite link to edit
   * @param  {Object} [options] Additional Telegram query options
   * @return {Object} ChatInviteLink
   * @see https://core.telegram.org/bots/api#editchatinvitelink
   */
  editChatInviteLink(
    chatId: TelegramBot.ChatId,
    inviteLink: string,
    name?: string,
    expire_date?: number,
    member_limit?: number,
    creates_join_request?: boolean,
    form: any = {},
  ): Promise<TelegramBot.ChatInviteLink> {
    form.chat_id = chatId;
    form.invite_link = inviteLink;
    form.name = name;
    form.expire_date = expire_date;
    form.member_limit = member_limit;
    form.creates_join_request = creates_join_request;
    return this._request('editChatInviteLink', { form });
  }

  /**
   * Use this method to revoke an invite link created by the bot.
   * Note: If the primary link is revoked, a new link is automatically generated
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns the revoked invite link as ChatInviteLink object.
   *
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup
   * @param  {Object} [options] Additional Telegram query options
   * @return {Object} ChatInviteLink
   * @see https://core.telegram.org/bots/api#revokechatinvitelink
   */
  revokeChatInviteLink(
    chatId: TelegramBot.ChatId,
    inviteLink: string,
    form: any = {},
  ): Promise<TelegramBot.ChatInviteLink> {
    form.chat_id = chatId;
    form.invite_link = inviteLink;
    return this._request('revokeChatInviteLink', { form });
  }

  /**
   * Use this method to approve a chat join request.
   * The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right.
   * Returns True on success.
   *
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Boolean} True on success
   * @see https://core.telegram.org/bots/api#approvechatjoinrequest
   */
  approveChatJoinRequest(
    chatId: TelegramBot.ChatId,
    userId: string,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.user_id = userId;
    return this._request('approveChatJoinRequest', { form });
  }

  /**
   * Use this method to decline a chat join request.
   * The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right.
   * Returns True on success.
   *
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Boolean} True on success
   * @see https://core.telegram.org/bots/api#declinechatjoinrequest
   */
  declineChatJoinRequest(
    chatId: TelegramBot.ChatId,
    userId: string,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.user_id = userId;
    return this._request('declineChatJoinRequest', { form });
  }

  /**
   * Use this method to set a new profile photo for the chat. Photos can't be changed for private chats.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {stream.Stream|Buffer} photo A file path or a Stream.
   * @param  {Object} [options] Additional Telegram query options
   * @param  {Object} [fileOptions] Optional file related meta-data
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setchatphoto
   */
  setChatPhoto(
    chatId: TelegramBot.ChatId,
    photo: string | stream | Buffer,
    options?: object,
    fileOptions?: TelegramBot.FileOptions,
  ): Promise<boolean> {
    const opts: any = {
      qs: options,
    };
    opts.qs.chat_id = chatId;
    try {
      const sendData = this._formatSendData('photo', photo, fileOptions);
      opts.formData = sendData[0];
      opts.qs.photo = sendData[1];
    } catch (ex) {
      return Promise.reject(ex);
    }
    return this._request('setChatPhoto', opts);
  }

  /**
   * Use this method to delete a chat photo. Photos can't be changed for private chats.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#deletechatphoto
   */
  deleteChatPhoto(
    chatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    return this._request('deleteChatPhoto', { form });
  }

  /**
   * Use this method to change the title of a chat. Titles can't be changed for private chats.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String} title New chat title, 1-255 characters
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setchattitle
   */
  setChatTitle(
    chatId: TelegramBot.ChatId,
    title: string,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.title = title;
    return this._request('setChatTitle', { form });
  }

  /**
   * Use this method to change the description of a supergroup or a channel.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String} description New chat title, 1-255 characters
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setchatdescription
   */
  setChatDescription(
    chatId: TelegramBot.ChatId,
    description: string,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.description = description;
    return this._request('setChatDescription', { form });
  }

  /**
   * Use this method to pin a message in a supergroup.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Number} messageId Identifier of a message to pin
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#pinchatmessage
   */
  pinChatMessage(
    chatId: TelegramBot.ChatId,
    messageId: number,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.message_id = messageId;
    return this._request('pinChatMessage', { form });
  }

  /**
   * Use this method to unpin a message in a supergroup chat.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#unpinchatmessage
   */
  unpinChatMessage(
    chatId: TelegramBot.ChatId,
    messageId?: number,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.messageId = messageId;
    return this._request('unpinChatMessage', { form });
  }

  /**
   * Use this method to clear the list of pinned messages in a chat
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#unpinallchatmessages
   */
  unpinAllChatMessages(
    chatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    return this._request('unpinAllChatMessages', { form });
  }

  /**
   * Use this method to send answers to callback queries sent from
   * inline keyboards. The answer will be displayed to the user as
   * a notification at the top of the chat screen or as an alert.
   * On success, True is returned.
   *
   * This method has **older, compatible signatures ([1][answerCallbackQuery-v0.27.1])([2][answerCallbackQuery-v0.29.0])**
   * that are being deprecated.
   *
   * @param  {String} callbackQueryId Unique identifier for the query to be answered
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#answercallbackquery
   */
  answerCallbackQuery(
    callbackQueryId: string,
    form?: Partial<TelegramBot.AnswerCallbackQueryOptions>,
  ): Promise<boolean> {
    /* The older method signature (in/before v0.27.1) was answerCallbackQuery(callbackQueryId, text, showAlert).
     * We need to ensure backwards-compatibility while maintaining
     * consistency of the method signatures throughout the library */
    if (typeof form !== 'object') {
      /* eslint-disable no-param-reassign, prefer-rest-params */
      deprecate(
        'The method signature answerCallbackQuery(callbackQueryId, text, showAlert) has been deprecated since v0.27.1',
      );
      form = {
        callback_query_id: arguments[0],
        text: arguments[1],
        show_alert: arguments[2],
      };
      /* eslint-enable no-param-reassign, prefer-rest-params */
    }
    /* The older method signature (in/before v0.29.0) was answerCallbackQuery([options]).
     * We need to ensure backwards-compatibility while maintaining
     * consistency of the method signatures throughout the library. */
    if (typeof callbackQueryId === 'object') {
      /* eslint-disable no-param-reassign, prefer-rest-params */
      deprecate(
        'The method signature answerCallbackQuery([options]) has been deprecated since v0.29.0',
      );
      form = callbackQueryId;
      /* eslint-enable no-param-reassign, prefer-rest-params */
    } else {
      form.callback_query_id = callbackQueryId;
    }
    return this._request('answerCallbackQuery', { form });
  }

  /**
   * Use this method to edit text messages sent by the bot or via
   * the bot (for inline bots). On success, the edited Message is
   * returned.
   *
   * Note that you must provide one of chat_id, message_id, or
   * inline_message_id in your request.
   *
   * @param  {String} text  New text of the message
   * @param  {Object} [options] Additional Telegram query options (provide either one of chat_id, message_id, or inline_message_id here)
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#editmessagetext
   */
  editMessageText(
    text: string,
    form?: TelegramBot.EditMessageTextOptions,
  ): Promise<TelegramBot.Message | boolean> {
    form.text = text;
    return this._request('editMessageText', { form });
  }

  /**
   * Use this method to edit captions of messages sent by the
   * bot or via the bot (for inline bots). On success, the
   * edited Message is returned.
   *
   * Note that you must provide one of chat_id, message_id, or
   * inline_message_id in your request.
   *
   * @param  {String} caption  New caption of the message
   * @param  {Object} [options] Additional Telegram query options (provide either one of chat_id, message_id, or inline_message_id here)
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#editmessagecaption
   */
  editMessageCaption(
    caption: string,
    form?: TelegramBot.EditMessageCaptionOptions,
  ): Promise<TelegramBot.Message | boolean> {
    form.caption = caption;
    return this._request('editMessageCaption', { form });
  }

  /**
   * Use this method to edit audio, document, photo, or video messages.
   * If a message is a part of a message album, then it can be edited only to a photo or a video.
   * Otherwise, message type can be changed arbitrarily. When inline message is edited, new file can't be uploaded.
   * Use previously uploaded file via its file_id or specify a URL.
   * On success, the edited Message is returned.
   *
   * Note that you must provide one of chat_id, message_id, or inline_message_id in your request.
   *
   * @param  {Object} media  A JSON-serialized object for a new media content of the message
   * @param  {Object} [options] Additional Telegram query options (provide either one of chat_id, message_id, or inline_message_id here)
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#editmessagemedia
   */
  editMessageMedia(
    media: TelegramBot.InputMedia,
    form: TelegramBot.EditMessageMediaOptions,
  ): Promise<TelegramBot.Message | boolean> {
    const regexAttach = /attach:\/\/.+/;

    if (typeof media.media === 'string' && regexAttach.test(media.media)) {
      const opts: any = {
        qs: form,
      };

      opts.formData = {};

      const payload = Object.assign({}, media);
      delete payload.media;

      try {
        const attachName = String(0);
        const [formData] = this._formatSendData(
          attachName,
          media.media.replace('attach://', ''),
          media.fileOptions,
        );

        if (formData) {
          opts.formData[attachName] = formData[attachName];
          payload.media = `attach://${attachName}`;
        } else {
          throw new errors.FatalError(
            `Failed to process the replacement action for your ${media.type}`,
          );
        }
      } catch (ex) {
        return Promise.reject(ex);
      }

      opts.qs.media = JSON.stringify(payload);

      return this._request('editMessageMedia', opts);
    }

    form.media = stringify(media);

    return this._request('editMessageMedia', { form });
  }

  /**
   * Use this method to edit only the reply markup of messages
   * sent by the bot or via the bot (for inline bots).
   * On success, the edited Message is returned.
   *
   * Note that you must provide one of chat_id, message_id, or
   * inline_message_id in your request.
   *
   * @param  {Object} replyMarkup  A JSON-serialized object for an inline keyboard.
   * @param  {Object} [options] Additional Telegram query options (provide either one of chat_id, message_id, or inline_message_id here)
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#editmessagetext
   */
  editMessageReplyMarkup(
    replyMarkup: TelegramBot.InlineKeyboardMarkup,
    form?: TelegramBot.EditMessageReplyMarkupOptions,
  ): Promise<TelegramBot.Message | boolean> {
    form.reply_markup = replyMarkup;
    return this._request('editMessageReplyMarkup', { form });
  }

  /**
   * Use this method to get a list of profile pictures for a user.
   * Returns a [UserProfilePhotos](https://core.telegram.org/bots/api#userprofilephotos) object.
   * This method has an [older, compatible signature][getUserProfilePhotos-v0.25.0]
   * that is being deprecated.
   *
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getuserprofilephotos
   */
  getUserProfilePhotos(
    userId: number | string,
    form?: TelegramBot.GetUserProfilePhotosOptions,
  ): Promise<TelegramBot.UserProfilePhotos> {
    /* The older method signature was getUserProfilePhotos(userId, offset, limit).
     * We need to ensure backwards-compatibility while maintaining
     * consistency of the method signatures throughout the library */
    if (typeof form !== 'object') {
      /* eslint-disable no-param-reassign, prefer-rest-params */
      deprecate(
        'The method signature getUserProfilePhotos(userId, offset, limit) has been deprecated since v0.25.0',
      );
      form = {
        offset: arguments[1],
        limit: arguments[2],
      };
      /* eslint-enable no-param-reassign, prefer-rest-params */
    }
    form.user_id = userId;
    return this._request('getUserProfilePhotos', { form });
  }

  /**
   * Send location.
   * Use this method to send point on the map.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Float} latitude Latitude of location
   * @param  {Float} longitude Longitude of location
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendlocation
   */
  sendLocation(
    chatId: TelegramBot.ChatId,
    latitude: number,
    longitude: number,
    form?: TelegramBot.SendLocationOptions,
  ): Promise<TelegramBot.Message> {
    form.chat_id = chatId;
    form.latitude = latitude;
    form.longitude = longitude;
    return this._request('sendLocation', { form });
  }

  /**
   * Use this method to edit live location messages sent by
   * the bot or via the bot (for inline bots).
   *
   * Note that you must provide one of chat_id, message_id, or
   * inline_message_id in your request.
   *
   * @param  {Float} latitude Latitude of location
   * @param  {Float} longitude Longitude of location
   * @param  {Object} [options] Additional Telegram query options (provide either one of chat_id, message_id, or inline_message_id here)
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#editmessagelivelocation
   */
  editMessageLiveLocation(
    latitude: number,
    longitude: number,
    form?: TelegramBot.EditMessageLiveLocationOptions,
  ): Promise<TelegramBot.Message | boolean> {
    form.latitude = latitude;
    form.longitude = longitude;
    return this._request('editMessageLiveLocation', { form });
  }

  /**
   * Use this method to stop updating a live location message sent by
   * the bot or via the bot (for inline bots) before live_period expires.
   *
   * Note that you must provide one of chat_id, message_id, or
   * inline_message_id in your request.
   *
   * @param  {Object} [options] Additional Telegram query options (provide either one of chat_id, message_id, or inline_message_id here)
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#stopmessagelivelocation
   */
  stopMessageLiveLocation(
    form?: TelegramBot.StopMessageLiveLocationOptions,
  ): Promise<TelegramBot.Message | boolean> {
    return this._request('stopMessageLiveLocation', { form });
  }

  /**
   * Send venue.
   * Use this method to send information about a venue.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Float} latitude Latitude of location
   * @param  {Float} longitude Longitude of location
   * @param  {String} title Name of the venue
   * @param  {String} address Address of the venue
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendvenue
   */
  sendVenue(
    chatId: TelegramBot.ChatId,
    latitude: number,
    longitude: number,
    title: string,
    address: string,
    form?: TelegramBot.SendVenueOptions,
  ): Promise<TelegramBot.Message> {
    form.chat_id = chatId;
    form.latitude = latitude;
    form.longitude = longitude;
    form.title = title;
    form.address = address;
    return this._request('sendVenue', { form });
  }

  /**
   * Send contact.
   * Use this method to send phone contacts.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String} phoneNumber Contact's phone number
   * @param  {String} firstName Contact's first name
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendcontact
   */
  sendContact(
    chatId: TelegramBot.ChatId,
    phoneNumber: string,
    firstName: string,
    form?: TelegramBot.SendContactOptions,
  ): Promise<TelegramBot.Message> {
    form.chat_id = chatId;
    form.phone_number = phoneNumber;
    form.first_name = firstName;
    return this._request('sendContact', { form });
  }

  /**
   * Get file.
   * Use this method to get basic info about a file and prepare it for downloading.
   * Attention: link will be valid for 1 hour.
   *
   * @param  {String} fileId  File identifier to get info about
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getfile
   */
  getFile(fileId: string, form: any = {}): Promise<TelegramBot.File> {
    form.file_id = fileId;
    return this._request('getFile', { form });
  }

  /**
   * Get link for file.
   * Use this method to get link for file for subsequent use.
   * Attention: link will be valid for 1 hour.
   *
   * This method is a sugar extension of the (getFile)[#getfilefileid] method,
   * which returns just path to file on remote server (you will have to manually build full uri after that).
   *
   * @param  {String} fileId  File identifier to get info about
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise} promise Promise which will have *fileURI* in resolve callback
   * @see https://core.telegram.org/bots/api#getfile
   */
  getFileLink(fileId: string, form: any = {}): Promise<string> {
    return this.getFile(fileId, form).then(
      (resp) =>
        `${this.options.baseApiUrl}/file/bot${this.token}/${resp.file_path}`,
    );
  }

  /**
   * Return a readable stream for file.
   *
   * `fileStream.path` is the specified file ID i.e. `fileId`.
   * `fileStream` emits event `info` passing a single argument i.e.
   * `info` with the interface `{ uri }` where `uri` is the URI of the
   * file on Telegram servers.
   *
   * This method is a sugar extension of the [getFileLink](#TelegramBot+getFileLink) method,
   * which returns the full URI to the file on remote server.
   *
   * @param  {String} fileId File identifier to get info about
   * @param  {Object} [options] Additional Telegram query options
   * @return {stream.Readable} fileStream
   */
  getFileStream(fileId: string, form: any = {}): any {
    const fileStream: any = new stream.PassThrough();
    fileStream.path = fileId;
    this.getFileLink(fileId, form)
      .then((fileURI) => {
        fileStream.emit('info', {
          uri: fileURI,
        });
        pump(
          streamedRequest(
            Object.assign({ uri: fileURI }, this.options.request),
          ),
          fileStream,
        );
      })
      .catch((error) => {
        fileStream.emit('error', error);
      });
    return fileStream;
  }

  /**
   * Downloads file in the specified folder.
   *
   * This method is a sugar extension of the [getFileStream](#TelegramBot+getFileStream) method,
   * which returns a readable file stream.
   *
   * @param  {String} fileId  File identifier to get info about
   * @param  {String} downloadDir Absolute path to the folder in which file will be saved
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise} promise Promise, which will have *filePath* of downloaded file in resolve callback
   */
  downloadFile(
    fileId: string,
    downloadDir: string,
    form: any = {},
  ): Promise<any> {
    let resolve;
    let reject;
    const promise = new Promise((a, b) => {
      resolve = a;
      reject = b;
    });
    const fileStream = this.getFileStream(fileId, form);
    fileStream.on('info', (info) => {
      const fileName = info.uri.slice(info.uri.lastIndexOf('/') + 1);
      // TODO: Ensure fileName doesn't contains slashes
      const filePath = path.join(downloadDir, fileName);
      pump(fileStream, fs.createWriteStream(filePath), (error) => {
        if (error) {
          return reject(error);
        }
        return resolve(filePath);
      });
    });
    fileStream.on('error', (err) => {
      reject(err);
    });
    return promise;
  }

  /**
   * Register a RegExp to test against an incomming text message.
   * @param  {RegExp}   regexp       RegExp to be executed with `exec`.
   * @param  {Function} callback     Callback will be called with 2 parameters,
   * the `msg` and the result of executing `regexp.exec` on message text.
   */
  onText(
    regexp: RegExp,
    callback: (msg: TelegramBot.Message, match: RegExpExecArray | null) => void,
  ): void {
    this._textRegexpCallbacks.push({ regexp, callback });
  }

  /**
   * Remove a listener registered with `onText()`.
   * @param  {RegExp} regexp RegExp used previously in `onText()`
   * @return {Object} deletedListener The removed reply listener if
   *   found. This object has `regexp` and `callback`
   *   properties. If not found, returns `null`.
   */
  removeTextListener(regexp: RegExp): TelegramBot.TextListener | null {
    const index = this._textRegexpCallbacks.findIndex((textListener) => {
      return String(textListener.regexp) === String(regexp);
    });
    if (index === -1) {
      return null;
    }
    return this._textRegexpCallbacks.splice(index, 1)[0];
  }
  /**
   * Remove all listeners registered with `onText()`.
   */
  clearTextListeners(): void {
    this._textRegexpCallbacks = [];
  }

  /**
   * Use this method to get up to date information about the chat
   * (current name of the user for one-on-one conversations, current
   * username of a user, group or channel, etc.).
   * @param  {Number|String} chatId Unique identifier for the target chat or username of the target supergroup or channel
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getchat
   */
  getChat(
    chatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<TelegramBot.Chat> {
    form.chat_id = chatId;
    return this._request('getChat', { form });
  }
  /**
   * Returns the administrators in a chat in form of an Array of `ChatMember` objects.
   * @param  {Number|String} chatId  Unique identifier for the target group or username of the target supergroup
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getchatadministrators
   */
  getChatAdministrators(
    chatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<TelegramBot.ChatMember[]> {
    form.chat_id = chatId;
    return this._request('getChatAdministrators', { form });
  }

  /**
   * Use this method to get the number of members in a chat.
   * Returns Int on success.
   * @param  {Number|String} chatId  Unique identifier for the target group or username of the target supergroup
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getchatmemberscount
   * @deprecated Deprecated since Telegram Bot API v5.3, replace it with "getChatMembersCount"
   */
  getChatMembersCount(
    chatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<number> {
    deprecate(
      'The method "getChatMembersCount" is deprecated since Telegram Bot API v5.3, replace it with "getChatMemberCount"',
    );

    form.chat_id = chatId;
    return this._request('getChatMembersCount', { form });
  }

  /**
   * Use this method to get information about a member of a chat.
   * @param  {Number|String} chatId  Unique identifier for the target group or username of the target supergroup
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getchatmember
   */
  getChatMember(
    chatId: TelegramBot.ChatId,
    userId: string,
    form: any = {},
  ): Promise<TelegramBot.ChatMember> {
    form.chat_id = chatId;
    form.user_id = userId;
    return this._request('getChatMember', { form });
  }

  /**
   * Leave a group, supergroup or channel.
   * @param  {Number|String} chatId Unique identifier for the target group or username of the target supergroup (in the format @supergroupusername)
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#leavechat
   */
  leaveChat(chatId: TelegramBot.ChatId, form: any = {}): Promise<boolean> {
    form.chat_id = chatId;
    return this._request('leaveChat', { form });
  }

  /**
   * Use this method to set a new group sticker set for a supergroup.
   * @param  {Number|String} chatId Unique identifier for the target group or username of the target supergroup (in the format @supergroupusername)
   * @param  {String} stickerSetName Name of the sticker set to be set as the group sticker set
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setchatstickerset
   */
  setChatStickerSet(
    chatId: TelegramBot.ChatId,
    stickerSetName: string,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.sticker_set_name = stickerSetName;
    return this._request('setChatStickerSet', { form });
  }

  /**
   * Use this method to delete a group sticker set from a supergroup.
   * @param  {Number|String} chatId Unique identifier for the target group or username of the target supergroup (in the format @supergroupusername)
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#deletechatstickerset
   */
  deleteChatStickerSet(
    chatId: TelegramBot.ChatId,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    return this._request('deleteChatStickerSet', { form });
  }

  /**
   * Use this method to send a game.
   * @param  {Number|String} chatId Unique identifier for the message recipient
   * @param  {String} gameShortName name of the game to be sent.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendgame
   */
  sendGame(
    chatId: TelegramBot.ChatId,
    gameShortName: string,
    form?: TelegramBot.SendGameOptions,
  ): Promise<TelegramBot.Message> {
    form.chat_id = chatId;
    form.game_short_name = gameShortName;
    return this._request('sendGame', { form });
  }

  /**
   * Use this method to set the score of the specified user in a game.
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Number} score New score value.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setgamescore
   */
  setGameScore(
    userId: string,
    score: number,
    form?: TelegramBot.SetGameScoreOptions,
  ): Promise<TelegramBot.Message | boolean> {
    form.user_id = userId;
    form.score = score;
    return this._request('setGameScore', { form });
  }

  /**
   * Use this method to get data for high score table.
   * @param  {Number} userId  Unique identifier of the target user
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getgamehighscores
   */
  getGameHighScores(
    userId: string,
    form?: TelegramBot.GetGameHighScoresOptions,
  ): Promise<TelegramBot.GameHighScore[]> {
    form.user_id = userId;
    return this._request('getGameHighScores', { form });
  }

  /**
   * Use this method to delete a message.
   * @param  {Number|String} chatId  Unique identifier of the target chat
   * @param  {Number} messageId  Unique identifier of the target message
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#deletemessage
   */
  deleteMessage(
    chatId: TelegramBot.ChatId,
    messageId: string,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.message_id = messageId;
    return this._request('deleteMessage', { form });
  }

  /**
   * Send invoice.
   * Use this method to send an invoice.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {String} title Product name
   * @param  {String} description product description
   * @param  {String} payload Bot defined invoice payload
   * @param  {String} providerToken Payments provider token
   * @param  {String} startParameter Deep-linking parameter
   * @param  {String} currency Three-letter ISO 4217 currency code
   * @param  {Array} prices Breakdown of prices
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendinvoice
   */
  sendInvoice(
    chatId: TelegramBot.ChatId,
    title: string,
    description: string,
    payload: string,
    providerToken: string,
    startParameter: string,
    currency: string,
    prices: ReadonlyArray<TelegramBot.LabeledPrice>,
    form?: any,
  ): Promise<TelegramBot.Message> {
    form.chat_id = chatId;
    form.title = title;
    form.description = description;
    form.payload = payload;
    form.provider_token = providerToken;
    form.start_parameter = startParameter;
    form.currency = currency;
    form.prices = stringify(prices);
    form.provider_data = stringify(form.provider_data);
    return this._request('sendInvoice', { form });
  }

  /**
   * Answer shipping query.
   * Use this method to reply to shipping queries.
   *
   * @param  {String} shippingQueryId  Unique identifier for the query to be answered
   * @param  {Boolean} ok Specify if delivery of the product is possible
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#answershippingquery
   */
  answerShippingQuery(
    shippingQueryId: string,
    ok: boolean,
    form?: any,
  ): Promise<boolean> {
    form.shipping_query_id = shippingQueryId;
    form.ok = ok;
    form.shipping_options = stringify(form.shipping_options);
    return this._request('answerShippingQuery', { form });
  }

  /**
   * Answer pre-checkout query.
   * Use this method to confirm shipping of a product.
   *
   * @param  {String} preCheckoutQueryId  Unique identifier for the query to be answered
   * @param  {Boolean} ok Specify if every order details are ok
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#answerprecheckoutquery
   */
  answerPreCheckoutQuery(
    preCheckoutQueryId: string,
    ok: boolean,
    form?: any,
  ): Promise<boolean> {
    form.pre_checkout_query_id = preCheckoutQueryId;
    form.ok = ok;
    return this._request('answerPreCheckoutQuery', { form });
  }

  /**
   * Use this method to set default chat permissions for all members.
   * The bot must be an administrator in the group or a supergroup for this to
   * work and must have the can_restrict_members admin rights.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Array} chatPermissions New default chat permissions
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setchatpermissions
   */
  setChatPermissions(
    chatId: TelegramBot.ChatId,
    chatPermissions: TelegramBot.ChatPermissions,
    form?: any,
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.permissions = JSON.stringify(chatPermissions);
    return this._request('setChatPermissions', { form });
  }

  /**
   * Use this method to set a custom title for an administrator in a supergroup promoted by the bot.
   * Returns True on success.
   *
   * @param  {Number|String} chatId  Unique identifier for the message recipient
   * @param  {Number} userId Unique identifier of the target user
   * @param  {String} customTitle New custom title for the administrator; 0-16 characters, emoji are not allowed
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setchatadministratorcustomtitle
   */
  setChatAdministratorCustomTitle(
    chatId: TelegramBot.ChatId,
    userId: string,
    customTitle: string,
    form: any = {},
  ): Promise<boolean> {
    form.chat_id = chatId;
    form.user_id = userId;
    form.custom_title = customTitle;
    return this._request('setChatAdministratorCustomTitle', { form });
  }

  /**
   * Use this method to get the current list of the bot's commands for the given scope and user language.
   * Returns Array of BotCommand on success. If commands aren't set, an empty list is returned.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getmycommands
   */
  getMyCommands(
    scope?: TelegramBot.BotCommandScope,
    language_code?: string,
    form: any = {},
  ): Promise<TelegramBot.BotCommand[]> {
    form.scope = scope;
    form.language_code = language_code;
    return this._request('getMyCommands', { form });
  }

  /**
   * Use this method to change the list of the bot's commands.
   * Returns True on success.
   * @param  {Array} commands Poll options, between 2-10 options
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setmycommands
   */
  setMyCommands(
    commands: TelegramBot.BotCommand[],
    form?: {
      language_code?: string;
      scope?: TelegramBot.BotCommandScope;
      commands?: string;
    },
  ): Promise<boolean> {
    form.commands = stringify(commands);
    return this._request('setMyCommands', { form });
  }

  /**
   * Use this method to change the bot's menu button in a private chat, or the default menu button.
   * Returns True on success.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#setchatmenubutton
   */
  setChatMenuButton(form: {
    chat_id?: number;
    menu_button?: TelegramBot.MenuButton;
  }): Promise<boolean> {
    return this._request('setChatMenuButton', { form });
  }

  /**
   * Use this method to get the current value of the bot's menu button in a private chat, or the default menu button.
   * Returns MenuButton on success.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getchatmenubutton
   */
  getChatMenuButton(form: {
    chat_id?: number;
  }): Promise<TelegramBot.MenuButton> {
    return this._request('getChatMenuButton', { form });
  }

  /**
   * Use this method to change the default administrator rights requested by the bot when it's added as an administrator to groups or channels.
   * These rights will be suggested to users, but they are are free to modify the list before adding the bot.
   * Returns True on success.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getchatmenubutton
   */
  setMyDefaultAdministratorRights(form: {
    rights?: TelegramBot.ChatAdministratorRights;
    for_channels?: boolean;
  }): Promise<boolean> {
    return this._request('setMyDefaultAdministratorRights', { form });
  }

  /**
   * Use this method to get the current default administrator rights of the bot.
   * Returns ChatAdministratorRights on success.
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getmydefaultadministratorrights
   */
  getMyDefaultAdministratorRights(form: {
    for_channels?: boolean;
  }): Promise<TelegramBot.ChatAdministratorRights> {
    return this._request('getMyDefaultAdministratorRights', { form });
  }

  /**
   * Use this method to set the result of an interaction with a Web App and send a corresponding message on behalf of the user to the chat from which the query originated.
   * On success, a SentWebAppMessage object is returned.
   *
   * @param  {String} webAppQueryId Unique identifier for the query to be answered
   * @param  {InlineQueryResult} result object that represents one result of an inline query
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#answercallbackquery
   */
  answerWebAppQuery(
    web_app_query_id: string,
    result: TelegramBot.InlineQueryResult,
    form: any = {},
  ): Promise<TelegramBot.SentWebAppMessage> {
    form.web_app_query_id = web_app_query_id;
    form.result = stringify(result);
    return this._request('answerWebAppQuery', { form });
  }
}
