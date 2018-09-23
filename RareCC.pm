# ConCon-Collector レア狐魂一覧生成用モジュール
# [狐魂一覧](https://c4.concon-collector.com/help/alllist)

use strict;
use warnings;
use utf8;

package RareCC {
    use Object::Simple -base;
    use HTML::Template;

    our @Forces       = ();
    our @Types        = ();
    our @TableHeaders = ();
    our $ViewUrlBase  = '';
    our $templateLink = '';

    has id       => 0;
    has same_id  => 0;
    has title    => '';
    has name     => '';
    has type     => 0;
    has lot_id   => 0;
    has rarity   => 0;
    has force_id => 0;
    has ids      => sub { [] };

    sub getStyleForce {
        my $self = shift;
        return 'force-back' . $self->force_id;
    }

    sub getTableRow {
        my $self = shift;
        return [
            map {
                {   rare_value_class => ( $_->{'Class'} || '' ),
                    rare_value => $self->getTableValue( $_->{'Key'} ),
                }
            } @TableHeaders
        ];
    }

    sub getTableValue {
        my $self      = shift;
        my $key       = shift;
        my $numOfFurs = $self->numOfFurs;
        return
              $key eq 'id'         ? $self->getLink
            : $key eq 'same_id'    ? $self->same_id
            : $key eq 'title'      ? $self->title
            : $key eq 'name'       ? $self->name
            : $key eq 'title_name' ? $self->title . $self->name
            : $key eq 'type'       ? $Types[ $self->type ]
            : $key eq 'lot_id'     ? $self->lot_id
            : $key eq 'rarity'     ? $self->rarity
            : $key eq 'force'      ? $Forces[ $self->force_id ]
            : $key eq 'numOfFurs' ? ( !$numOfFurs ? '' : $numOfFurs )
            : $key eq 'furs' ? join( " ", map { $self->getLink($_) } @{ $self->ids } )
            :                  undef;
    }

    sub getLink {
        my $self = shift;
        my $id = shift || $self->id;
        $templateLink->param( base => $ViewUrlBase, id => $id );
        return $templateLink->output;
    }

    sub numOfFurs {
        my $self = shift;
        return scalar( @{ $self->ids } );
    }
}

package RareCCs {
    use Object::Simple -base;

    our @TableHeaders = ();
    our $NumOfFurMin  = 0;

    sub ids {
        my $self   = shift;
        my %option = @_;
        my @ids
            = !$option{'byFurs'}
            ? keys( %{$self} )
            : grep { $self->{$_}->numOfFurs >= $NumOfFurMin } keys( %{$self} );
        return sort {
                 !$option{'byFurs'}
                ? $a <=> $b
                : ( $self->{$b}->numOfFurs <=> $self->{$a}->numOfFurs || $a <=> $b )
        } @ids;
    }

    sub addList {
        my $self    = shift;
        my $allList = shift;
        foreach my $concon ( @{$allList} ) {
            my $rareCC = RareCC->new($concon);
            my $sameId = $rareCC->same_id;
            if ( !!$self->{$sameId} ) {
                push( @{ $self->{$sameId}->ids }, $rareCC->id );
            } else {
                $self->{$sameId} = $rareCC;
            }
        }
        return $self;
    }

    sub addRareCC {
        my $self   = shift;
        my $rareCC = shift;
        if ( !$self->{ $rareCC->id } ) {
            $self->{ $rareCC->id } = $rareCC;
        }
    }

    sub getTableHeaders {
        my $self = shift;
        return [ map { { rare_header => $_->{'Label'} } } @TableHeaders ];
    }

    sub getTableBody {
        my $self   = shift;
        my %option = @_;
        return [
            map {
                {   rare_style_force => $self->{$_}->getStyleForce,
                    rare_values      => $self->{$_}->getTableRow,
                }
            } $self->ids(%option)
        ];
    }
}

package Lot {
    use Object::Simple -base;

    our @Types = ();

    has id     => 0;
    has type   => 0;
    has title  => '';
    has rarity => sub { {} };    # key: rarity, value: RareCCs.

    sub new {
        my $self = shift->SUPER::new(@_);
        if ( !$self->id ) {
            $self->id( -scalar(@Types) + $self->type );
            $self->title( $Types[ $self->type ] );
        } else {
            $self->title( '第' . $self->id . '弾' );
        }
        return $self;
    }

    sub addRareCC {
        my $self   = shift;
        my $rareCC = shift;
        my $rarity = $rareCC->rarity;
        if ( !$self->rarity->{$rarity} ) {
            $self->rarity->{$rarity} = RareCCs->new();
        }
        $self->rarity->{$rarity}->addRareCC($rareCC);
    }

    sub getTocRarity {
        my $self  = shift;
        my $lotId = $self->id;
        return [
            map {
                {   toc_rarity_link  => "#Lot${lotId}_Rare${_}",
                    toc_rarity_label => "レア度${_}",
                }
                }
                sort( keys( %{ $self->rarity } ) )
        ];
    }

    sub getRarities {
        my $self  = shift;
        my $lotId = $self->id;
        return [
            map {
                my $rares = $self->rarity->{$_};
                {   rarity_link  => "Lot${lotId}_Rare${_}",
                    rarity_label => "レア度${_}",
                    rare_headers => $rares->getTableHeaders,
                    rares        => $rares->getTableBody,
                };
            } sort( keys( %{ $self->rarity } ) )
        ];
    }
}

package Lots {
    use Object::Simple -base;

    sub addRareCCs {
        my $self  = shift;
        my $rares = shift;
        foreach my $id ( keys( %{$rares} ) ) {
            my $rareCC = $rares->{$id};
            my $lot = Lot->new( id => $rareCC->lot_id, type => $rareCC->type );
            if ( !$self->hasLot($lot) ) {
                $self->addLot($lot);
            } else {
                $lot = $self->{ $lot->id };
            }
            $lot->addRareCC($rareCC);
        }
        return $self;
    }

    sub hasLot {
        my $self = shift;
        my $lot  = shift;
        return !!$self->{ $lot->id };
    }

    sub addLot {
        my $self = shift;
        my $lot  = shift;
        $self->{ $lot->id } = $lot;
        return $self;
    }

    sub keys {
        my $self = shift;
        return sort { $a <=> $b } ( keys( %{$self} ) );
    }

    sub getTitle {
        my $self = shift;
        my @keys = $self->keys;
        return $keys[0] < 0
            ? join( ", ", map { $self->{$_}->title } $self->keys )
            : $self->{ $keys[0] }->title . ' - ' . $self->{ $keys[$#keys] }->title;
    }

    sub getToc {
        my $self = shift;
        return [
            map {
                {   toc_link     => "#Lot${_}",
                    toc_label    => $self->{$_}->title,
                    toc_rarities => $self->{$_}->getTocRarity,
                }
            } $self->keys
        ];
    }

    sub getLots {
        my $self = shift;
        return [
            map {
                {   lot_link  => "Lot${_}",
                    lot_label => $self->{$_}->title,
                    rarities  => $self->{$_}->getRarities,
                }
            } $self->keys
        ];
    }
}

package LogGroups {
    use Object::Simple -base;

    our $NumOfLotGroup = 0;

    sub divideLots {
        my $self = shift;
        my $lots = shift;
        foreach my $lotId ( sort { $a <=> $b } ( keys( %{$lots} ) ) ) {
            my $lot = $lots->{$lotId};
            my $index
                = $lotId <= 0
                ? 0
                : int( ( $lotId - 1 ) / $NumOfLotGroup ) + 1;
            if ( !$self->{$index} ) {
                $self->{$index} = Lots->new();
            }
            $self->{$index}->addLot($lot);
        }
        return $self;
    }
}

1;

# EOF

