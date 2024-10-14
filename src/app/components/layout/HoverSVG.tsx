"use client";
import React, { useState, useRef, useEffect } from "react";

interface HoverSVGProps {
    src: string;
    width: number;
    height: number;
    color: string;
    alt: string;
    hoverColor: string;
}

const HoverSVG: React.FC<HoverSVGProps> = ({ src, color, hoverColor }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [uniqueId, setUniqueId] = useState("");
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Generate a unique ID when the component mounts
        setUniqueId(`svg-filter-${Math.random().toString(36).substr(2, 9)}`);
    }, []);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const currentColor = isHovered ? hoverColor : color;

    return (
        <div
            ref={componentRef}
            className="w-4 h-4 md:w-8 md:h-8"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <svg width="100%" height="100%">
                <defs>
                    <filter id={uniqueId}>
                        <feFlood floodColor={currentColor} result="flood" />
                        <feComposite
                            in="SourceGraphic"
                            in2="flood"
                            operator="arithmetic"
                            k1="1"
                            k2="0"
                            k3="0"
                            k4="0"
                        />
                    </filter>
                </defs>
                <image
                    href={src}
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    filter={`url(#${uniqueId})`}
                />
            </svg>
        </div>
    );
};

export default HoverSVG;
