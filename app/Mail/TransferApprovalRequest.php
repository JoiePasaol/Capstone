<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TransferApprovalRequest extends Mailable
{
    use Queueable, SerializesModels;

    public $transferredItem;
    public $type;
    public $signatory;

    public function __construct($transferredItem, $type = null, $signatory = null)
    {
        $this->transferredItem = $transferredItem;
        $this->type = $type;
        $this->signatory = $signatory;
    }

    public function build()
    {
        return $this->subject('Item Transfer Approval Request')
            ->markdown('emails.transfer-approval', [
                'transferredItem' => $this->transferredItem,
                'type' => $this->type,
                'signatory' => $this->signatory,
                'url' => url('/transferred-items/'.$this->transferredItem->id.'/approve?signatory_type='.$this->type)
            ]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Transfer Approval Request',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.transfer-approval'
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
