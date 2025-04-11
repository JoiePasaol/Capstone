<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TransferApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $transferredItem;
    public $type;
    public $signatory;

    public function __construct($transferredItem, $type, $signatory = null)
    {
        $this->transferredItem = $transferredItem;
        $this->type = $type;
        $this->signatory = $signatory;
    }

    public function build()
    {
        return $this->subject('Transfer Approved - Confirmation')
            ->markdown('emails.transfer-approved', [
                'transferredItem' => $this->transferredItem,
                'type' => $this->type,
                'signatory' => $this->signatory
            ]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Transfer Approved - Confirmation',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.transfer-approved'
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
