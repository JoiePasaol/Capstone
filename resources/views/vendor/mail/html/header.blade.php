@props(['url'])
<tr>
    <td class="header">
        <a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
            @if (trim($slot) === 'Laravel')
                <span style="font-size: 32px; font-weight: bold; color: #0011ff; padding: 5px; display: inline-block;">
                    IIS
                </span>
            @else
                {{ $slot }}
            @endif
        </a>
    </td>
</tr>
