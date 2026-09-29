import React, { useState } from 'react';
import { MxButton, MxLinkButton } from '../MxWidgets.jsx';
import { MxContainer, MxListView, MxLayoutGrid, MxRow, MxColumn, MxText } from '../MxForm.jsx';
import { FileAttachmentsPage, MxConfirmation } from './ServicePopups.jsx';
import { attachmentTypes } from '../../data/serviceData.js';

/**
 * The comments-and-attachments block under every request form.
 *
 * Two snippets in the model, identical down to the container classes except
 * for how a row is built, so they are one component with a `variant`:
 *
 *   Main.Snip_RequestCommentsAndAttachments                 (Drivers, Catering)
 *     comment row     : textbox + delete
 *     attachment row  : a three-column layout grid - name, type, delete
 *
 *   DigitalCard.Snip_RequestCommentsAndAttachments_DigitalCard    (Digital Card)
 *     comment row     : textarea + delete
 *     attachment row  : .d-flex-attach - name then delete
 *
 * The stylesheet flattens the layout-grid form into the same shape as
 * `.d-flex-attach` ("so all four read alike"), and draws the paperclip tile as
 * a ::before on each, which is why both DOMs are reproduced rather than merged.
 *
 * Add on Comments creates an empty row inline (Main.ACT_CreateComment);
 * Add on Attachments opens Main.FileAttachmentsPage, which is the pop-up that
 * returns the file.
 *
 * Both trash buttons are `Action: delete_object`, and the client always puts its
 * own confirmation in front of that action - the same prompt the page's Delete
 * button raises - so neither row is removed until it is answered. The prompt
 * belongs to the button, not to the page, which is why it is held here and every
 * page that calls this snippet gets it.
 */
export default function RequestCommentsAndAttachments({
  variant = 'shared',
  comments,
  attachments,
  onAddComment,
  onChangeComment,
  onDeleteComment,
  onAddAttachment,
  onDeleteAttachment
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  /* The row a trash button is asking about: { kind: 'comment' | 'attachment', id }. */
  const [pendingDelete, setPendingDelete] = useState(null);

  function confirmDelete() {
    if (pendingDelete.kind === 'comment') onDeleteComment(pendingDelete.id);
    else onDeleteAttachment(pendingDelete.id);
    setPendingDelete(null);
  }
  const digitalCard = variant === 'digitalCard';
  const page = digitalCard
    ? 'sn.DigitalCard.Snip_RequestCommentsAndAttachments_DigitalCard'
    : 'sn.Main.Snip_RequestCommentsAndAttachments';

  return (
    <MxContainer name="container13" className="commercial-boxes">
      <MxContainer name="container14" className="row-items gray-rounded-container m-end-1">

        {/* ------------------------------------------------------- comments */}
        <MxContainer name="container34" className="comment-attachment-heading">
          <MxText name="text11" renderMode="h4">
            Comments
          </MxText>
          <MxButton
            name="actionButton6"
            caption="Add"
            className="add-button"
            icon="add"
            page={page}
            onClick={onAddComment}
          />
        </MxContainer>

        <MxListView
          name="listView3"
          className="comments-list"
          items={comments}
          keyOf={(comment) => comment.id}
          renderItem={(comment) => (
            <MxContainer name="container37" className="d-flex  sm-form-comment">
              {digitalCard ? (
                <textarea
                  className="form-control comment-input mx-name-textArea1"
                  style={{ width: '100%' }}
                  value={comment.Comment}
                  placeholder="Type your comment here"
                  onChange={(event) => onChangeComment(comment.id, event.target.value)}
                />
              ) : (
                <div className="form-group mx-name-textBox2 common-form_group comment-input spacing-outer-top-small">
                  <input
                    className="form-control"
                    type="text"
                    value={comment.Comment}
                    placeholder="Type your comment here"
                    onChange={(event) => onChangeComment(comment.id, event.target.value)}
                  />
                </div>
              )}
              <MxButton
                name="actionButton7"
                className="comment-delete_btn"
                icon="trash-can"
                page={page}
                onClick={() => setPendingDelete({ kind: 'comment', id: comment.id })}
              />
            </MxContainer>
          )}
        />

        {/* ---------------------------------------------------- attachments */}
        <MxContainer
          name="container39"
          className={digitalCard ? 'comment-attachment-heading ' : 'comment-attachment-heading required-form-group'}
        >
          <MxText name="text12" renderMode="h4">
            Attachments
          </MxText>
          <MxButton
            name="actionButton8"
            caption="Add"
            className="add-button"
            icon="add"
            page={page}
            onClick={() => setUploadOpen(true)}
          />
        </MxContainer>

        <MxListView
          name="listView4"
          className="sm-attachment-list"
          items={attachments}
          keyOf={(attachment) => attachment.id}
          renderItem={(attachment) => (
            <MxContainer name="container40" className="add-attachments-row">
              {digitalCard ? (
                <MxContainer name="container1" className="d-flex-attach">
                  <MxContainer name="container2">
                    <MxLinkButton
                      name="actionButton10"
                      caption={attachment.Name}
                      page={page}
                      href="#"
                      onClick={(event) => event.preventDefault()}
                    />
                  </MxContainer>
                  <MxButton
                    name="actionButton12"
                    className="comment-delete_btn"
                    icon="trash-can"
                    page={page}
                    onClick={() => setPendingDelete({ kind: 'attachment', id: attachment.id })}
                  />
                </MxContainer>
              ) : (
                <MxLayoutGrid name="layoutGrid2">
                  <MxRow>
                    <MxColumn>
                      <MxLinkButton
                        name="actionButton10"
                        caption={attachment.Name}
                        page={page}
                        href="#"
                        onClick={(event) => event.preventDefault()}
                      />
                    </MxColumn>
                    <MxColumn>
                      <MxText name="text2" className="attachment-type-file">
                        {attachment.type || attachmentTypes[0]}
                      </MxText>
                    </MxColumn>
                    <MxColumn>
                      <MxButton
                        name="actionButton12"
                        className="comment-delete_btn"
                        icon="trash-can"
                        page={page}
                        onClick={() => setPendingDelete({ kind: 'attachment', id: attachment.id })}
                      />
                    </MxColumn>
                  </MxRow>
                </MxLayoutGrid>
              )}
            </MxContainer>
          )}
        />
      </MxContainer>

      <MxContainer name="container38" />

      {pendingDelete && (
        <MxConfirmation
          content="Are you sure you want to delete this?"
          onProceed={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {uploadOpen && (
        <FileAttachmentsPage
          onClose={() => setUploadOpen(false)}
          onSave={(file) => {
            onAddAttachment(file);
            setUploadOpen(false);
          }}
        />
      )}
    </MxContainer>
  );
}
